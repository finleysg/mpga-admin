// MPGA is a Minnesota organisation. A fixed time zone gives the same text on the server (UTC
// container) and in the browser, so there's no hydration mismatch.
const TIME_ZONE = "America/Chicago"

export function LocalDate({
	value,
	withTime = false,
}: {
	value: Date | string
	withTime?: boolean
}) {
	const date = new Date(value)
	const text = date.toLocaleString("en-US", {
		timeZone: TIME_ZONE,
		year: "numeric",
		month: "short",
		day: "numeric",
		...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
	})
	return <time dateTime={date.toISOString()}>{text}</time>
}
