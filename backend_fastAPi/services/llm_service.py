import httpx
import json
from typing import Dict, Any
import logging
import os
from dotenv import load_dotenv
import asyncio
import re

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class LLMServiceError(Exception):
    """Exception raised for errors in the LLM service."""
    pass

class LLMService:
    """Service for interacting with the Replicate API."""
    
    def __init__(self):
        self.base_url = "https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct/predictions"
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            raise LLMServiceError("REPLICATE_API_TOKEN environment variable not set")
        self.timeout = httpx.Timeout(timeout=120.0)
        self.poll_interval = 1.0
        self.max_polls = 30
    
    async def _poll_for_completion(self, client: httpx.AsyncClient, get_url: str) -> Dict[str, Any]:
        """Poll the prediction URL until it's complete."""
        for _ in range(self.max_polls):
            response = await client.get(
                get_url,
                headers={"Authorization": f"Bearer {self.api_token}"}
            )
            result = response.json()
            
            if result.get("status") == "succeeded":
                return result
            elif result.get("status") == "failed":
                raise LLMServiceError(f"Prediction failed: {result.get('error')}")
            
            await asyncio.sleep(self.poll_interval)
        
        raise LLMServiceError("Prediction timed out")

    async def generate(self, prompt: str) -> Dict[str, str]:
        """Generate UI code based on the requirement."""
        try:
            structured_prompt = f"""You are a UI development expert. Create a complete implementation for this requirement: '{prompt}'

Return only the code in three blocks:
```html
[Your HTML code here]
```

```css
[Your CSS code here]
```

```javascript
[Your JavaScript code here]
```

Make the code clean, modern, and production-ready. Include proper styling and interactivity."""

            payload = {
                "input": {
                    "prompt": structured_prompt,
                    "temperature": 0.7,
                    "max_new_tokens": 1000  # Increased for complete code generation
                }
            }
            
            logger.debug(f"Sending request to Replicate API")
            logger.debug(f"Payload length: {len(structured_prompt)}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_token}",
                        "Content-Type": "application/json"
                    }
                )
                
                logger.debug(f"Response status: {response.status_code}")
                
                if response.status_code != 201:
                    raise LLMServiceError(f"API returned status {response.status_code}: {response.text}")
                
                prediction = response.json()
                if not prediction or 'urls' not in prediction or 'get' not in prediction['urls']:
                    raise LLMServiceError("Invalid response format")

                final_result = await self._poll_for_completion(client, prediction['urls']['get'])
                
                if not final_result.get('output'):
                    raise LLMServiceError("No output in prediction")
                
                # Join the output chunks and extract code blocks
                combined_output = ''.join(final_result['output'])
                
                # Extract code blocks using regex
                html = re.search(r'```html\s*(.*?)\s*```', combined_output, re.DOTALL)
                css = re.search(r'```css\s*(.*?)\s*```', combined_output, re.DOTALL)
                js = re.search(r'```javascript\s*(.*?)\s*```', combined_output, re.DOTALL)
                
                return {
                    'html': html.group(1).strip() if html else "",
                    'css': css.group(1).strip() if css else "",
                    'javascript': js.group(1).strip() if js else ""
                }
                
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            raise LLMServiceError(f"Error: {str(e)}")
