import { describe, expect, it } from "vitest"

import { dashboardRedirect, isLibraryRole, isRoleDowngrade } from "../roles"

describe("dashboardRedirect", () => {
	it("lets admins and super admins go anywhere", () => {
		expect(dashboardRedirect("admin", "/tournaments/four-ball")).toBeNull()
		expect(dashboardRedirect("super_admin", "/admin/users")).toBeNull()
	})

	it("keeps board members inside the library", () => {
		expect(dashboardRedirect("board", "/library")).toBeNull()
		expect(dashboardRedirect("board", "/library/file/12")).toBeNull()
		expect(dashboardRedirect("board", "/")).toBe("/library")
		expect(dashboardRedirect("board", "/tournaments/four-ball")).toBe("/library")
		expect(dashboardRedirect("board", "/library-other")).toBe("/library")
	})

	it("turns away portal users and users without a role", () => {
		expect(dashboardRedirect("user", "/")).toBe("/login?denied=1")
		expect(dashboardRedirect(null, "/library")).toBe("/login?denied=1")
	})
})

describe("roles", () => {
	it("grants library access to board and admin roles only", () => {
		expect(["board", "admin", "super_admin"].every(isLibraryRole)).toBe(true)
		expect(isLibraryRole("user")).toBe(false)
		expect(isLibraryRole(undefined)).toBe(false)
	})

	it("detects downgrades", () => {
		expect(isRoleDowngrade("admin", "board")).toBe(true)
		expect(isRoleDowngrade("super_admin", "admin")).toBe(true)
		expect(isRoleDowngrade("board", "admin")).toBe(false)
		expect(isRoleDowngrade("admin", "admin")).toBe(false)
	})
})
