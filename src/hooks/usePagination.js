import { useState } from "react";

const PAGE_SIZE = 10;

// Keep the complete source/cache intact; only slice rows for presentation.
export default function usePagination(items, resetKey = "") {
  const [position, setPosition] = useState({ key: resetKey, page: 1 });
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Object.is(position.key, resetKey) ? Math.min(position.page, pageCount) : 1;

  // Synchronize during render so filters/deletions never show an empty old page.
  if (!Object.is(position.key, resetKey) || position.page !== page) {
    setPosition({ key: resetKey, page });
  }

  const offset = (page - 1) * PAGE_SIZE;
  const setPage = (next) => setPosition({
    key: resetKey,
    page: Math.max(1, Math.min(next, pageCount)),
  });

  return { items: items.slice(offset, offset + PAGE_SIZE), page, pageCount, total, offset, pageSize: PAGE_SIZE, setPage };
}
