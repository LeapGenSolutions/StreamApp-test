import {
  buildPermissionsMap,
  buildFullAccessPermissions,
  computeEffectivePermissions,
  hasAnyPermission,
  hasPermission,
  normalizeRole,
} from "./rbac";

describe("rbac utilities", () => {
  test("normalizes planned role aliases", () => {
    expect(normalizeRole("NP")).toBe("Nurse Practitioner");
    expect(normalizeRole("BO")).toBe("Staff");
    expect(normalizeRole("Seismic Doctors")).toBe("SeismicDoctors");
    expect(normalizeRole(["Staff"])).toBe("Staff");
  });

  test("builds role defaults and applies valid overrides", () => {
    const permissions = computeEffectivePermissions("Staff", {
      overrides: {
        "video_call.start": "write",
        "settings.ehr_integration": "read",
        "unknown.permission": "write",
      },
    });

    expect(permissions["appointments.join_call"]).toBe("none");
    expect(permissions["video_call.start"]).toBe("write");
    expect(permissions["settings.ehr_integration"]).toBe("read");
    expect(permissions["unknown.permission"]).toBeUndefined();
  });

  test("builds custom role defaults from a full or partial role map", () => {
    const customRolePermissions = buildPermissionsMap({
      "dashboard.view_appointments": "read",
      "reports.billing_history": "write",
      "settings.payment_billing": "invalid",
    });

    const permissions = computeEffectivePermissions(
      "Billing Specialist",
      {
        overrides: {
          "settings.payment_billing": "read",
        },
      },
      customRolePermissions
    );

    expect(permissions["dashboard.view_appointments"]).toBe("read");
    expect(permissions["reports.billing_history"]).toBe("write");
    expect(permissions["settings.payment_billing"]).toBe("read");
    expect(permissions["appointments.join_call"]).toBe("none");
  });

  test("checks permission levels correctly", () => {
    const permissions = computeEffectivePermissions("Doctor");

    expect(hasPermission(permissions, "post_call.edit_soap_notes", "read")).toBe(true);
    expect(hasPermission(permissions, "post_call.edit_soap_notes", "write")).toBe(true);
    expect(hasPermission(permissions, "admin.manage_rbac", "read")).toBe(false);
    expect(
      hasAnyPermission(permissions, [
        { required: "admin.manage_rbac", level: "read" },
        { required: "reports.billing_history", level: "read" },
      ])
    ).toBe(true);
  });

  test("grants SeismicDoctors full write access across the app", () => {
    const permissions = computeEffectivePermissions("SeismicDoctors");
    const fullAccessPermissions = buildFullAccessPermissions();

    expect(permissions).toEqual(fullAccessPermissions);
    expect(hasPermission(permissions, "dashboard.view_appointments", "write")).toBe(true);
    expect(hasPermission(permissions, "admin.manage_rbac", "write")).toBe(true);
    expect(hasAnyPermission(permissions, [
      { required: "reports.billing_history", level: "write" },
      { required: "settings.payment_billing", level: "write" },
    ])).toBe(true);
  });
});
