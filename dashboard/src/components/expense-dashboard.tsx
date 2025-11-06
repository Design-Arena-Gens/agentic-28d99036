"use client";

import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  Expense,
  useExpenseStore
} from "@/lib/expense-store";
import { formatCurrency, formatDate, getMonthKey } from "@/lib/format";

type CategoryFilter = Expense["category"] | "All";

interface ExpenseFormState {
  description: string;
  amount: string;
  category: Expense["category"];
  paymentMethod: Expense["paymentMethod"];
  date: string;
  notes: string;
}

const now = new Date();
const todayIso = now.toISOString().slice(0, 10);

const defaultFormState: ExpenseFormState = {
  description: "",
  amount: "",
  category: "Food",
  paymentMethod: "Card",
  date: todayIso,
  notes: ""
};

function buildMonthOptions(expenses: Expense[]) {
  const unique = new Set<string>();
  expenses.forEach((expense) => unique.add(getMonthKey(expense.date)));
  const months = Array.from(unique.values()).sort().reverse();
  const currentMonth = getMonthKey(todayIso);
  return Array.from(new Set([currentMonth, ...months]));
}

export function ExpenseDashboard() {
  const { expenses, addExpense, removeExpense, reset } = useExpenseStore();
  const [form, setForm] = useState<ExpenseFormState>(defaultFormState);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [monthFilter, setMonthFilter] = useState<string>(getMonthKey(todayIso));
  const [searchTerm, setSearchTerm] = useState("");

  const monthOptions = useMemo(() => buildMonthOptions(expenses), [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory =
        categoryFilter === "All" || expense.category === categoryFilter;
      const matchesMonth =
        monthFilter === "all" || getMonthKey(expense.date) === monthFilter;
      const matchesSearch =
        !searchTerm ||
        expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesMonth && matchesSearch;
    });
  }, [expenses, categoryFilter, monthFilter, searchTerm]);

  const totals = useMemo(() => {
    const total = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const categories = filteredExpenses.reduce<Record<string, number>>(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
        return acc;
      },
      {}
    );

    const topCategory =
      Object.entries(categories)
        .sort(([, a], [, b]) => b - a)
        .at(0) ?? null;

    const average =
      filteredExpenses.length === 0
        ? 0
        : total / filteredExpenses.length;

    return {
      total,
      topCategory,
      average,
      categories
    };
  }, [filteredExpenses]);

  const recentExpenses = filteredExpenses.slice(0, 6);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number.parseFloat(form.amount);
    if (!form.description.trim() || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    addExpense({
      description: form.description.trim(),
      amount: Number(amount.toFixed(2)),
      category: form.category,
      paymentMethod: form.paymentMethod,
      date: form.date,
      notes: form.notes.trim() || undefined
    });

    setForm((state) => ({
      ...defaultFormState,
      date: state.date
    }));
  };

  return (
    <main className="min-h-screen px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Personal finance
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Expense Dashboard
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Track your spending at a glance, keep categories balanced, and
              understand how your everyday decisions shape the bigger picture.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-700 px-5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Reset demo data
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/40">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Monthly spend
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatCurrency(totals.total, { precise: true })}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Based on filters applied
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/40">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Avg. per expense
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatCurrency(totals.average, { precise: true })}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Across {filteredExpenses.length} entries
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/40">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Top category
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {totals.topCategory ? totals.topCategory[0] : "—"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {totals.topCategory
                ? formatCurrency(totals.topCategory[1], { precise: true })
                : "Add more data to see insights"}
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[350px,1fr]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Quick add expense
              </h2>
              <span className="text-xs text-slate-500">
                Stored locally on this device
              </span>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Description</span>
              <input
                value={form.description}
                onChange={(event) =>
                  setForm((state) => ({ ...state, description: event.target.value }))
                }
                placeholder="Coffee with friends"
                className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                required
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-300">Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((state) => ({ ...state, amount: event.target.value }))
                  }
                  placeholder="25.00"
                  className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-300">Date</span>
                <input
                  type="date"
                  value={form.date}
                  max={todayIso}
                  onChange={(event) =>
                    setForm((state) => ({ ...state, date: event.target.value }))
                  }
                  className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-300">Category</span>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      category: event.target.value as Expense["category"]
                    }))
                  }
                  className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-300">Payment method</span>
                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm((state) => ({
                      ...state,
                      paymentMethod: event.target.value as Expense["paymentMethod"]
                    }))
                  }
                  className="h-10 rounded-lg border border-slate-700 bg-slate-950/60 px-3 text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((state) => ({ ...state, notes: event.target.value }))
                }
                placeholder="Optional context for this expense"
                className="min-h-[90px] rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-blue-500 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:shadow-xl hover:shadow-violet-900/50"
            >
              Add expense
            </button>
          </form>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Spending insights
                </h2>
                <div className="flex flex-wrap gap-3 text-sm">
                  <select
                    value={monthFilter}
                    onChange={(event) => setMonthFilter(event.target.value)}
                    className="h-9 rounded-full border border-slate-700 bg-slate-950/60 px-4 text-slate-300 outline-none transition hover:border-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                  >
                    <option value="all">All months</option>
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {new Date(`${month}-01`).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric"
                        })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value as CategoryFilter)
                    }
                    className="h-9 rounded-full border border-slate-700 bg-slate-950/60 px-4 text-slate-300 outline-none transition hover:border-slate-500 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                  >
                    <option value="All">All categories</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {CATEGORIES.map((category) => {
                  const value = totals.categories[category] ?? 0;
                  const max = Math.max(1, ...Object.values(totals.categories));
                  const progress = Math.round((value / max) * 100);
                  return (
                    <div
                      key={category}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                    >
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>{category}</span>
                        <span>{formatCurrency(value, { precise: true })}</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-800">
                        <div
                          className={clsx(
                            "h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Recent activity
                </h2>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search description…"
                  className="h-9 rounded-full border border-slate-700 bg-slate-950/60 px-4 text-sm text-slate-300 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40"
                />
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Method</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Amount
                      </th>
                      <th className="px-4 py-3 font-medium text-right">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {recentExpenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-slate-500"
                        >
                          No expenses match your filters yet.
                        </td>
                      </tr>
                    ) : (
                      recentExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="transition hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">
                              {expense.description}
                            </div>
                            {expense.notes ? (
                              <div className="text-xs text-slate-400">
                                {expense.notes}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {expense.category}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {expense.paymentMethod}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-white">
                            {formatCurrency(expense.amount, { precise: true })}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeExpense(expense.id)}
                              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 transition hover:border-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
