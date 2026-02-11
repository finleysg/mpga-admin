export * from "./constants"
export * from "./models"
export * from "./media"

export interface ActionResult<T = void> {
	success: boolean
	error?: string
	data?: T
}
