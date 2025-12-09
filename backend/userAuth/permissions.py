from rest_framework import permissions

class IsRole(permissions.BasePermission):

    allowed_roles = []
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                hasattr(request.user, 'role') and 
                request.user.role in self.allowed_roles)

class IsOwner(IsRole):
    allowed_roles = ['owner']

class IsManagement(IsRole):
    allowed_roles = ['management']

class IsGuest(IsRole):
    allowed_roles = ['guest']