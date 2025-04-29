import re
from typing import Dict, Any, Optional
from services.llm_service import LLMService

class AgentService:
    """Service that implements AI agent behavior for UI generation."""
    
    def __init__(self):
        self.llm_service = LLMService()
        
    async def process_requirement(self, requirement: str) -> Dict[str, Any]:
        """
        Process a UI requirement through the agent's reasoning and generation steps.
        
        Args:
            requirement: The user's UI requirement
            
        Returns:
            A dictionary with the generated HTML, CSS, and JavaScript, plus additional details
        """
        # Step 1: Analyze the requirement
        analysis = await self._analyze_requirement(requirement)
        
        # Step 2: Create a plan for implementation
        plan = await self._plan_implementation(requirement, analysis)
        
        # Step 3: Generate the UI code based on the analysis and plan
        generation_result = await self._generate_ui_code(requirement, analysis, plan)
        
        # Extract HTML, CSS, and JavaScript from the generation result
        html, css, javascript = self._extract_code_blocks(generation_result)
        
        # Check if we need to provide feedback instead of partial code
        feedback = None
        if not (html or css or javascript):
            feedback = await self._generate_feedback(requirement, analysis)
        
        return {
            "html": html,
            "css": css,
            "javascript": javascript,
            "analysis": analysis,
            "plan": plan,
            "feedback": feedback
        }
    
    async def _analyze_requirement(self, requirement: str) -> str:
        """Analyze the user requirement to understand what's needed."""
        prompt = f"""
        You are a UI development expert. Carefully analyze the following UI requirement:
        
        '{requirement}'
        
        Provide a detailed analysis of what this UI requires:
        1. Core functionality needed
        2. UI components required
        3. Potential challenges or ambiguities
        4. Any missing information that might be needed
        
        Return only your analysis, formatted clearly.
        """
        
        return await self.llm_service.generate(prompt)
    
    async def _plan_implementation(self, requirement: str, analysis: str) -> str:
        """Create a plan for implementing the UI based on the analysis."""
        prompt = f"""
        Based on this UI requirement: '{requirement}'
        
        And this analysis: '{analysis}'
        
        Create a step-by-step plan to implement the UI:
        1. HTML structure required
        2. CSS styling approach 
        3. JavaScript functionality needed
        4. Implementation order
        
        Return only the concrete implementation plan, formatted as a clear list.
        """
        
        return await self.llm_service.generate(prompt)
    
    async def _generate_ui_code(self, requirement: str, analysis: str, plan: str) -> str:
        """Generate the actual UI code based on the requirement, analysis and plan."""
        prompt = f"""
        Based on this UI requirement: '{requirement}'
        Analysis: '{analysis}'
        Implementation plan: '{plan}'
        
        Generate the complete UI implementation with three code blocks:
        
        1. HTML (inside ```html and ``` tags)
        2. CSS (inside ```css and ``` tags)
        3. JavaScript (inside ```javascript and ``` tags)
        
        Make sure each block is properly formatted and implements the plan.
        If anything is unclear or not feasible, explain why in your code comments.
        """
        
        return await self.llm_service.generate(prompt)
    
    async def _generate_feedback(self, requirement: str, analysis: str) -> str:
        """Generate feedback when the requirement is too vague or not feasible."""
        prompt = f"""
        The following UI requirement appears to be unclear or not feasible:
        
        '{requirement}'
        
        Based on this analysis: '{analysis}'
        
        Please provide:
        1. A clear explanation of what makes this requirement challenging
        2. Specific questions that would help clarify the requirement
        3. Alternative suggestions that might meet the user's needs
        
        Format this as helpful feedback to the user.
        """
        
        return await self.llm_service.generate(prompt)
    
    def _extract_code_blocks(self, text: str) -> tuple[str, str, str]:
        """Extract HTML, CSS, and JavaScript code blocks from the generated text."""
        html = ""
        css = ""
        javascript = ""
        
        # Extract HTML
        html_matches = re.search(r"```html\s*(.*?)\s*```", text, re.DOTALL)
        if html_matches:
            html = html_matches.group(1).strip()
            
        # Extract CSS
        css_matches = re.search(r"```css\s*(.*?)\s*```", text, re.DOTALL)
        if css_matches:
            css = css_matches.group(1).strip()
            
        # Extract JavaScript
        js_matches = re.search(r"```javascript\s*(.*?)\s*```", text, re.DOTALL)
        if js_matches:
            javascript = js_matches.group(1).strip()
        
        return html, css, javascript
