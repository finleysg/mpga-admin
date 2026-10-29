import console from "node:console"
import process from "node:process"

// Security baseline from the October 21, 2026 Node release. Update with each security release.
const [major, minor, patch] = process.versions.node.split(".").map(Number)
if (major !== 24 || minor < 22 || (minor === 22 && patch < 1)) {
	throw new Error(
		`Node ${process.versions.node} does not meet the supported Node 24 >=24.22.1 baseline`,
	)
}
console.log(JSON.stringify(process.versions))
