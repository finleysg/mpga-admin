"use client";

import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mpga/ui";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { type ContactData, listContactsAction } from "./actions";

type SortField = "name" | "email" | "cityState";
type SortDirection = "asc" | "desc";
type PageSize = 10 | 25 | 50 | "all";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const result = await listContactsAction();
        if (result.success && result.data) {
          setContacts(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) {
      return contacts;
    }

    const term = searchTerm.toLowerCase();
    return contacts.filter((contact) => {
      const firstName = contact.firstName?.toLowerCase() ?? "";
      const lastName = contact.lastName?.toLowerCase() ?? "";
      const email = contact.email?.toLowerCase() ?? "";
      const phone = contact.primaryPhone?.toLowerCase() ?? "";
      const city = contact.city?.toLowerCase() ?? "";

      return (
        firstName.includes(term) ||
        lastName.includes(term) ||
        `${firstName} ${lastName}`.includes(term) ||
        `${lastName}, ${firstName}`.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        city.includes(term)
      );
    });
  }, [contacts, searchTerm]);

  const sortedContacts = useMemo(() => {
    const sorted = [...filteredContacts];
    const multiplier = sortDirection === "asc" ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortField) {
        case "name": {
          const lastNameCompare = (a.lastName ?? "").localeCompare(
            b.lastName ?? "",
          );
          if (lastNameCompare !== 0) return lastNameCompare * multiplier;
          return (
            (a.firstName ?? "").localeCompare(b.firstName ?? "") * multiplier
          );
        }
        case "email":
          return (a.email ?? "").localeCompare(b.email ?? "") * multiplier;
        case "cityState": {
          const cityCompare = (a.city ?? "").localeCompare(b.city ?? "");
          if (cityCompare !== 0) return cityCompare * multiplier;
          return (a.state ?? "").localeCompare(b.state ?? "") * multiplier;
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [filteredContacts, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(value === "all" ? "all" : (Number(value) as 10 | 25 | 50));
    setCurrentPage(1);
  };

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.max(1, Math.ceil(sortedContacts.length / pageSize));
  }, [sortedContacts.length, pageSize]);

  const paginatedContacts = useMemo(() => {
    if (pageSize === "all") return sortedContacts;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedContacts.slice(startIndex, startIndex + pageSize);
  }, [sortedContacts, currentPage, pageSize]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="ml-1 inline h-4 w-4 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 inline h-4 w-4" />
    );
  };

  const formatCityState = (city: string | null, state: string | null) => {
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return "-";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-secondary-500">
          Contacts
        </h1>
        <Button onClick={() => router.push("/members/contacts/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-6">
        {loading ? (
          <div className="py-8 text-center text-gray-500">
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No contacts found
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-gray-500">
                Showing {filteredContacts.length} of {contacts.length} contacts
              </div>
            </div>
            {filteredContacts.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No contacts match your search
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort("name")}
                      >
                        Name
                        <SortIcon field="name" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort("email")}
                      >
                        Email
                        <SortIcon field="email" />
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort("cityState")}
                      >
                        City/State
                        <SortIcon field="cityState" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/members/contacts/${contact.id}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {contact.lastName}, {contact.firstName}
                        </TableCell>
                        <TableCell>{contact.email ?? "-"}</TableCell>
                        <TableCell>{contact.primaryPhone ?? "-"}</TableCell>
                        <TableCell>
                          {formatCityState(contact.city, contact.state)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show</span>
                    <select
                      value={String(pageSize)}
                      onChange={(e) => handlePageSizeChange(e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="all">All</option>
                    </select>
                    <span className="text-sm text-gray-500">per page</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
