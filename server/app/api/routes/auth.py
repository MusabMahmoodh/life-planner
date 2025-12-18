from fastapi import APIRouter, HTTPException, status
from app.db.supabase_client import supabase
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """Register a new user with Supabase Auth"""

    try:
        # Sign up with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )

        # Check if session exists (might be None if email confirmation is required)
        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration successful. Please check your email to confirm your account."
            )

        return TokenResponse(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            user={
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "created_at": auth_response.user.created_at
            }
        )

    except HTTPException:
        # Re-raise HTTP exceptions (like email confirmation requirement)
        raise
    except Exception as e:
        error_message = str(e)
        if "already registered" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login user with Supabase Auth"""

    try:
        # Sign in with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to create session. Please verify your email first."
            )

        return TokenResponse(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            user={
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "created_at": auth_response.user.created_at
            }
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )