from fastapi import APIRouter, HTTPException, status
from models.request_models import PRDRequest, PRDApprovalRequest
from models.response_models import PRDResponse, GenerateResponse
from services.prd_service import PRDService
from services.agent_service import AgentService

router = APIRouter(tags=["prd"])
prd_service = PRDService()
agent_service = AgentService()

@router.post("/generate-prd", response_model=PRDResponse, status_code=status.HTTP_200_OK)
async def generate_prd(request: PRDRequest):
    """
    Generate a PRD based on the user's requirement.
    """
    if not request.requirement or not request.requirement.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requirement cannot be empty"
        )
    prd = await prd_service.generate_prd(request.requirement)
    return PRDResponse(prd=prd)

@router.post("/approve-prd", response_model=GenerateResponse, status_code=status.HTTP_200_OK)
async def approve_prd(request: PRDApprovalRequest):
    """
    Process the approved PRD and generate UI code.
    Only proceeds if the PRD was approved by the user.
    """
    if not request.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot proceed without PRD approval"
        )

    # Pass the original requirement to the agent service for code generation
    result = await agent_service.process_requirement(request.requirement)
    return GenerateResponse(**result)