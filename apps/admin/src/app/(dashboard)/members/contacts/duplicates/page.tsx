"use client";

import { Button, Sheet, toast } from "@mpga/ui";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { DuplicateGroup } from "../actions";
import { findDuplicatesAction } from "../actions";
import { DuplicateCard } from "./duplicate-card";
import { MergeDrawer } from "./merge-drawer";

const PAGE_SIZE = 10;

export default function DuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(
    null,
  );

  useEffect(() => {
    async function load() {
      try {
        const result = await findDuplicatesAction();
        if (result.success && result.data) {
          setGroups(result.data);
        } else {
          toast.error(result.error ?? "Failed to find duplicates");
        }
      } catch {
        toast.error("Failed to find duplicates");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredGroups = useMemo(() => {
    if (!searchFilter.trim()) return groups;
    const term = searchFilter.toLowerCase();
    return groups.filter((g) =>
      g.contacts.some((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(term),
      ),
    );
  }, [groups, searchFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const pagedGroups = useMemo(
    () =>
      filteredGroups.slice(
        currentPage * PAGE_SIZE,
        (currentPage + 1) * PAGE_SIZE,
      ),
    [filteredGroups, currentPage],
  );

  const handleMerged = (groupId: string) => {
    setSelectedGroup(null);
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== groupId);
      const maxPage = Math.max(0, Math.ceil(next.length / PAGE_SIZE) - 1);
      if (currentPage > maxPage) setCurrentPage(maxPage);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/members/contacts"
          className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Contacts
        </Link>
        <h1 className="font-heading text-3xl font-bold text-secondary-500">
          Duplicate Contacts
        </h1>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">
          Scanning for duplicates...
        </div>
      ) : groups.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No duplicate contacts found
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-secondary-500 focus:outline-none focus:ring-1 focus:ring-secondary-500 sm:w-64"
              />
            </div>
            <p className="text-sm text-gray-600">
              {filteredGroups.length}{" "}
              {filteredGroups.length === 1 ? "group" : "groups"}
            </p>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No groups match your search
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedGroups.map((group) => (
                  <DuplicateCard
                    key={group.id}
                    group={group}
                    onDeduplicate={setSelectedGroup}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Sheet
        open={selectedGroup !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedGroup(null);
        }}
      >
        {selectedGroup && (
          <MergeDrawer
            group={selectedGroup}
            onMerged={handleMerged}
            onClose={() => setSelectedGroup(null)}
          />
        )}
      </Sheet>
    </div>
  );
}
