import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs"
import type { PaginationState, SortingState } from "@tanstack/react-table"

interface UseTableSearchParamsOptions {
	defaultSort: SortingState
	defaultPageSize?: number
}

export function useTableSearchParams({
	defaultSort,
	defaultPageSize = 25,
}: UseTableSearchParamsOptions) {
	const [params, setParams] = useQueryStates(
		{
			q: parseAsString.withDefault(""),
			sort: parseAsString.withDefault(defaultSort[0]?.id ?? ""),
			desc: parseAsString.withDefault(defaultSort[0]?.desc ? "1" : "0"),
			page: parseAsInteger.withDefault(0),
			size: parseAsString.withDefault(String(defaultPageSize)),
		},
		{ shallow: true },
	)

	const globalFilter = params.q
	const setGlobalFilter = (value: string) => {
		setParams({ q: value || null, page: 0 })
	}

	const sorting: SortingState = params.sort
		? [{ id: params.sort, desc: params.desc === "1" }]
		: defaultSort

	const setSorting = (valueOrUpdater: SortingState | ((prev: SortingState) => SortingState)) => {
		const newSorting =
			typeof valueOrUpdater === "function" ? valueOrUpdater(sorting) : valueOrUpdater
		if (newSorting.length > 0) {
			setParams({ sort: newSorting[0]!.id, desc: newSorting[0]!.desc ? "1" : "0" })
		} else {
			setParams({ sort: null, desc: null })
		}
	}

	const pagination: PaginationState = {
		pageIndex: params.page,
		pageSize: params.size === "all" ? 9999 : Number(params.size),
	}

	const setPagination = (
		valueOrUpdater: PaginationState | ((prev: PaginationState) => PaginationState),
	) => {
		const newPagination =
			typeof valueOrUpdater === "function" ? valueOrUpdater(pagination) : valueOrUpdater
		setParams({ page: newPagination.pageIndex, size: String(newPagination.pageSize) })
	}

	const pageSizeOption = params.size
	const setPageSizeOption = (value: string) => {
		setParams({ size: value, page: 0 })
	}

	return {
		globalFilter,
		setGlobalFilter,
		sorting,
		setSorting,
		pagination,
		setPagination,
		pageSizeOption,
		setPageSizeOption,
	}
}

export function useYearSearchParam(defaultYear: number) {
	return useQueryState(
		"year",
		parseAsInteger.withDefault(defaultYear).withOptions({ shallow: true }),
	)
}
