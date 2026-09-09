import { afterEach, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import usePagination from "../src/hooks/usePagination";
import Pagination from "../src/components/Pagination";

afterEach(cleanup);
const rows = Array.from({ length: 23 }, (_, i) => i + 1);
function List({ items = rows, filter = "", disabled = false }) {
  const pagination = usePagination(items, filter);
  return <><ul>{pagination.items.map(item => <li key={item}>{item}</li>)}</ul><Pagination pagination={pagination} disabled={disabled} /></>;
}

it.each([0, 1, 10])("hides navigation for %s rows", count => {
  render(<List items={rows.slice(0, count)} />);
  expect(screen.queryByRole("navigation")).toBeNull();
  expect(screen.queryAllByRole("listitem")).toHaveLength(count);
});

it("shows rows 11–20 and the final partial page with correct boundaries", () => {
  render(<List />);
  expect(screen.getAllByRole("listitem")).toHaveLength(10);
  expect(screen.getByRole("button", { name: "Sebelumnya" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  expect(screen.getAllByRole("listitem").map(row => row.textContent)).toEqual(rows.slice(10, 20).map(String));
  expect(screen.getByText("11–20")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Selanjutnya" }));
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getByText("21–23")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Selanjutnya" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Sebelumnya" }));
  expect(screen.getByText("Halaman 2 dari 3")).toBeTruthy();
});

it("resets on filter or document change even if the row count stays the same", () => {
  const { result, rerender } = renderHook(({ key }) => usePagination(rows, key), { initialProps: { key: "first" } });
  act(() => result.current.setPage(2));
  rerender({ key: "second" });
  expect(result.current.page).toBe(1);
  expect(result.current.items).toEqual(rows.slice(0, 10));
});

it("clamps after deletions and does not jump back when rows are added", () => {
  const { result, rerender } = renderHook(({ items }) => usePagination(items), { initialProps: { items: rows } });
  act(() => result.current.setPage(3));
  rerender({ items: rows.slice(0, 20) });
  expect(result.current.page).toBe(2);
  expect(result.current.items).toHaveLength(10);
  rerender({ items: [...rows] });
  expect(result.current.page).toBe(2);
  rerender({ items: [] });
  expect(result.current.page).toBe(1);
  expect(result.current.offset).toBe(0);
});

it("preserves the page across cache refreshes without modifying the source", () => {
  const source = Object.freeze([...rows]);
  const { result, rerender } = renderHook(({ items }) => usePagination(items), { initialProps: { items: source } });
  act(() => result.current.setPage(2));
  rerender({ items: [...source] });
  expect(result.current.page).toBe(2);
  expect(source).toHaveLength(23);
});

it("disables navigation during an operation", () => {
  render(<List disabled />);
  expect(screen.getByRole("button", { name: "Selanjutnya" }).disabled).toBe(true);
});
