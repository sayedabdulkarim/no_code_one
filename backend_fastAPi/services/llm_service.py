import httpx
import json
from typing import Dict, Any
import logging
import os
from dotenv import load_dotenv
import asyncio

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
        self.poll_interval = 1.0  # seconds between polling attempts
        self.max_polls = 30  # maximum number of polling attempts
    
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

    async def generate(self, prompt: str) -> str:
        try:
            payload = {
                "input": {
                    "prompt": prompt,
                    "temperature": 0.7,
                    "max_new_tokens": 300,
                }
            }
            
            logger.debug(f"Sending request to Replicate API")
            logger.debug(f"Payload: {payload}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Initial prediction request
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_token}",
                        "Content-Type": "application/json",
                    }
                )
                
                logger.debug(f"Replicate API Response status: {response.status_code}")
                
                if response.status_code != 201:  # Changed from 200 to 201
                    error_msg = f"Replicate API returned status code {response.status_code}: {response.text}"
                    logger.error(error_msg)
                    raise LLMServiceError(error_msg)
                
                prediction = response.json()
                if not prediction or 'urls' not in prediction or 'get' not in prediction['urls']:
                    raise LLMServiceError("Invalid initial response format from Replicate")
                
                # Poll until completion
                final_result = await self._poll_for_completion(client, prediction['urls']['get'])
                
                if not final_result.get('output'):
                    raise LLMServiceError("No output in completed prediction")
                
                # Replicate returns output as a list of strings
                return ''.join(final_result['output'])
                
        except httpx.TimeoutException as e:
            logger.error(f"Timeout error: {str(e)}")
            raise LLMServiceError(f"Replicate API timeout: {str(e)}")
        except httpx.RequestError as e:
            logger.error(f"Request error: {str(e)}")
            raise LLMServiceError(f"Error connecting to Replicate API: {str(e)}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            raise LLMServiceError(f"Failed to parse Replicate response as JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise LLMServiceError(f"Unexpected error: {str(e)}")
