package auth

import "testing"

func TestHasPermissionSuperAdminHasEverything(t *testing.T) {
	for _, p := range AllPermissions {
		if !HasPermission(RoleSuperAdmin, p) {
			t.Errorf("super_admin should have %q", p)
		}
	}
}

func TestHasPermissionViewerIsReadOnly(t *testing.T) {
	if HasPermission(RoleViewer, PermissionContentWrite) {
		t.Error("viewer must not have content:write")
	}
	if !HasPermission(RoleViewer, PermissionDashboardRead) {
		t.Error("viewer should have dashboard:read")
	}
	if HasPermission(RoleViewer, PermissionSystemWrite) {
		t.Error("viewer must not have system:write")
	}
}

func TestReceptionistScope(t *testing.T) {
	if !HasPermission(RoleReceptionist, PermissionAppointmentsWrite) {
		t.Error("receptionist should write appointments")
	}
	if HasPermission(RoleReceptionist, PermissionContentWrite) {
		t.Error("receptionist must not write content")
	}
	if HasPermission(RoleReceptionist, PermissionAppointmentsDelete) {
		t.Error("receptionist must not delete appointments")
	}
}

func TestPermissionsForRoleSuperAdminMatchesCatalog(t *testing.T) {
	got := PermissionsForRole(RoleSuperAdmin)
	if len(got) != len(AllPermissions) {
		t.Fatalf("super_admin permissions = %d, want %d", len(got), len(AllPermissions))
	}
}

func TestPermissionsForRoleIsOrdered(t *testing.T) {
	// content_editor should yield permissions in AllPermissions order.
	got := PermissionsForRole(RoleContentEditor)
	idx := -1
	for _, p := range got {
		next := indexOf(AllPermissions, p)
		if next <= idx {
			t.Fatalf("permissions not in catalog order: %v", got)
		}
		idx = next
	}
}

func TestIsAssignableRole(t *testing.T) {
	if !IsAssignableRole(RoleClinicAdmin) {
		t.Error("clinic_admin should be assignable")
	}
	if IsAssignableRole("admin") {
		t.Error("internal alias 'admin' must not be assignable")
	}
	if IsAssignableRole("nonsense") {
		t.Error("unknown role must not be assignable")
	}
}

func indexOf(s []string, v string) int {
	for i, x := range s {
		if x == v {
			return i
		}
	}
	return -1
}
