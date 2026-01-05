from fastapi import APIRouter, HTTPException, status
from app.db.supabase_client import supabase_admin
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.utils.auth import get_password_hash, verify_password, create_access_token
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """Register a new user - simple email/password stored in database"""

    try:
        existing_user = supabase_admin.table('users')\
            .select('*')\
            .eq('email', request.email)\
            .execute()

        if existing_user.data and len(existing_user.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash the password
        password_hash = get_password_hash(request.password)

        # Create user in database
        user_response = supabase_admin.table('users').insert({
            "email": request.email,
            "password_hash": password_hash
        }).execute()

        if not user_response.data or len(user_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

        user = user_response.data[0]

        # Create access token
        access_token = create_access_token(
            data={"sub": user["id"], "email": user["email"]}
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user["id"],
                "email": user["email"],
                "created_at": user["created_at"]
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login user - verify password and return JWT token"""

    try:
        # Get user from database
        user_response = supabase_admin.table('users')\
            .select('*')\
            .eq('email', request.email)\
            .execute()

        if not user_response.data or len(user_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        user = user_response.data[0]

        # Verify password
        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )

        # Create access token
        access_token = create_access_token(
            data={"sub": user["id"], "email": user["email"]}
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user["id"],
                "email": user["email"],
                "created_at": user["created_at"]
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )