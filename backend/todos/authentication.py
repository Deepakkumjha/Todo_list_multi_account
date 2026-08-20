"""Auth0 JWT authentication with JWKS key rotation support."""
from functools import lru_cache
from urllib.request import urlopen

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import Account


@lru_cache(maxsize=1)
def get_jwks():
    if not settings.AUTH0_DOMAIN:
        raise exceptions.AuthenticationFailed("Auth0 is not configured")
    with urlopen(f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json", timeout=5) as response:
        return jwt.PyJWKSet.from_dict(__import__("json").load(response))


class Auth0JWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate_header(self, request):
        # Makes DRF return 401 (with the standard challenge) for absent tokens.
        return self.keyword

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None
        parts = header.split()
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            raise exceptions.AuthenticationFailed("Use a Bearer token")
        if not settings.AUTH0_AUDIENCE:
            raise exceptions.AuthenticationFailed("Auth0 is not configured")
        try:
            unverified = jwt.get_unverified_header(parts[1])
            key = next(key for key in get_jwks().keys if key.key_id == unverified.get("kid"))
            claims = jwt.decode(parts[1], key.key, algorithms=["RS256"], audience=settings.AUTH0_AUDIENCE, issuer=settings.AUTH0_ISSUER)
        except (jwt.PyJWTError, StopIteration, OSError) as error:
            raise exceptions.AuthenticationFailed("Invalid access token") from error
        subject = claims.get("sub")
        if not subject:
            raise exceptions.AuthenticationFailed("Token has no subject")
        account, _ = Account.objects.get_or_create(auth0_user_id=subject, defaults={"email": claims.get("email", "")})
        return (account, claims)
