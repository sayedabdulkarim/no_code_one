import httpx
import json
from typing import Dict, Any

class LLMServiceError(Exception):
    """Exception raised for errors in the LLM service."""
    pass

class LLMService:
    """Service for interacting with the local LLM API."""
    
    def __init__(self, base_url: str = "http://localhost:11434/api/generate", model: str = "llama3.2:1b"):
        self.base_url = base_url
        self.model = model
        self.timeout = httpx.Timeout(30.0, connect=10.0)
        
    async def generate(self, prompt: str) -> str:
        """
        Send a prompt to the LLM and get the generated response.
        
        Args:
            prompt: The prompt to send to the LLM
            
        Returns:
            The generated text response
            
        Raises:
            LLMServiceError: If there's an error connecting to or getting a response from the LLM
        """
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code != 200:
                    raise LLMServiceError(f"LLM API returned status code {response.status_code}: {response.text}")
                
                result = response.json()
                return result.get("response", "")
                
        except httpx.RequestError as e:
            raise LLMServiceError(f"Error connecting to LLM API: {str(e)}")
        except json.JSONDecodeError:
            raise LLMServiceError("Failed to parse LLM response as JSON")
        except Exception as e:
            raise LLMServiceError(f"Unexpected error: {str(e)}")
