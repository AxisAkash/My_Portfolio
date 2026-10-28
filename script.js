(() => {
  'use strict';

  /* -------------------------------------------------------------------------- */
  /* Configuration and state                                                    */
  /* -------------------------------------------------------------------------- */
  const CFG = {
    storageKey: 'flowledger-state-v1',
    seededKey: 'flowledger-seeded-v1',
    currencySymbols: { USD: '$', EUR: '€', GBP: '£', BDT: '৳' },
    categories: {
      income: [
        { name: 'Salary', emoji: '💼', color: '#2ecc8f' },
        { name: 'Freelance', emoji: '🧑‍💻', color: '#22d3ee' },
        { name: 'Investment', emoji: '📈', color: '#a78bfa' },
        { name: 'Gift', emoji: '🎁', color: '#fbbf24' },
        { name: 'Other income', emoji: '↗', color: '#4a90d9' }
      ],
      expense: [
        { name: 'Housing', emoji: '🏠', color: '#e05c6a' },
        { name: 'Food', emoji: '🍽️', color: '#fb923c' },
        { name: 'Transport', emoji: '🚗', color: '#22d3ee' },
        { name: 'Utilities', emoji: '💡', color: '#fbbf24' },
        { name: 'Shopping', emoji: '🛍️', color: '#a78bfa' },
        { name: 'Health', emoji: '🩺', color: '#2ecc8f' },
        { name: 'Entertainment', emoji: '🎧', color: '#4a90d9' },
        { name: 'Education', emoji: '📚', color: '#67b0f1' },
        { name: 'Other expense', emoji: '↘', color: '#e879f9' }
      ]
    },
    demoWave: {
      labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      income: [4850, 5200, 5000, 5600, 5400, 5900],
      expense: [3050, 3200, 3450, 3150, 3600, 3300]
    }
  };

  const S = {
    transactions: [],
    settings: {
      name: 'Alex Kim',
      email: 'alex@flowledger.app',
      currency: 'USD',
      theme: 'dark',
      compact: false
    },
    view: 'dashboard',
    period: 'month',
    formType: 'income',
    filter: 'all',
    query: '',
    sort: 'newest',
    charts: new Map(),
    confirmAction: null,
    lastFocus: null,
    drawerOpen: false
  };

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  /* -------------------------------------------------------------------------- */
  /* Utilities                                                                   */
  /* -------------------------------------------------------------------------- */
  const Utils = {
    esc(value) {
      return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      })[character]);
    },

    debounce(fn, delay = 240) {
      let timer;
      return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), delay);
      };
    },

    today() {
      const date = new Date();
      const offset = date.getTimezoneOffset();
      return new Date(date.getTime() - (offset * 60 * 1000)).toISOString().slice(0, 10);
    },

    dateFromOffset(days) {
      const date = new Date(`${this.today()}T12:00:00`);
      date.setDate(date.getDate() - days);
      return date.toISOString().slice(0, 10);
    },

    dateLabel(isoDate) {
      const date = new Date(`${isoDate}T12:00:00`);
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    },

    groupLabel(isoDate) {
      const today = this.today();
      const yesterday = this.dateFromOffset(1);
      if (isoDate === today) return 'Today';
      if (isoDate === yesterday) return 'Yesterday';
      return this.dateLabel(isoDate);
    },

    monthLabel(key, short = true) {
      const date = new Date(`${key}-01T12:00:00`);
      return new Intl.DateTimeFormat('en-US', { month: short ? 'short' : 'long' }).format(date);
    },

    monthKey(dateValue) {
      return String(dateValue).slice(0, 7);
    },

    quarterKey(dateValue) {
      const date = new Date(`${dateValue}T12:00:00`);
      return `${date.getFullYear()} Q${Math.floor(date.getMonth() / 3) + 1}`;
    },

    currency(value, compact = false) {
      const amount = Number(value) || 0;
      const currency = S.settings.currency || 'USD';
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency', currency, notation: compact ? 'compact' : 'standard',
          maximumFractionDigits: compact && Math.abs(amount) >= 1000 ? 1 : 2,
          minimumFractionDigits: compact && Math.abs(amount) >= 1000 ? 0 : 2
        }).format(amount);
      } catch {
        return `${CFG.currencySymbols[currency] || '$'}${amount.toFixed(2)}`;
      }
    },

    symbol() {
      return CFG.currencySymbols[S.settings.currency] || '$';
    },

    percent(value) {
      return `${(Number(value) || 0).toFixed(1)}%`;
    },

    clamp(value, min = 0, max = 100) {
      return Math.min(max, Math.max(min, Number(value) || 0));
    },

    category(type, name) {
      return CFG.categories[type].find((category) => category.name === name) || CFG.categories[type].at(-1);
    },

    sum(items, type) {
      return items.filter((item) => !type || item.type === type).reduce((total, item) => total + Number(item.amount || 0), 0);
    },

    activeMonths(items) {
      return new Set(items.map((item) => this.monthKey(item.date))).size;
    },

    setText(id, value) {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    },

    randomId() {
      return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    focusables(container) {
      return $$('button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])', container);
    }
  };

  const Store = {
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(CFG.storageKey) || '{}');
        if (Array.isArray(saved.transactions)) S.transactions = saved.transactions;
        if (saved.settings && typeof saved.settings === 'object') S.settings = { ...S.settings, ...saved.settings };
      } catch {
        S.transactions = [];
      }
    },

    save() {
      try {
        localStorage.setItem(CFG.storageKey, JSON.stringify({ transactions: S.transactions, settings: S.settings }));
      } catch {
        Toast.show('Local storage is unavailable. Changes may not persist.', 'error');
      }
    }
  };

  const seed = () => {
    let seeded = false;
    try {
      seeded = localStorage.getItem(CFG.seededKey) === 'true';
    } catch {
      seeded = false;
    }
    if (seeded) return;

    const demo = [
      ['Monthly salary', 5200, 'income', 'Salary', 0, 'October payroll'],
      ['Apartment rent', 1450, 'expense', 'Housing', 1, ''],
      ['Grocery run', 184.22, 'expense', 'Food', 3, 'Weekly essentials'],
      ['Freelance project', 850, 'income', 'Freelance', 6, 'Product review sprint'],
      ['Metro card', 64, 'expense', 'Transport', 8, ''],
      ['Electricity bill', 92.4, 'expense', 'Utilities', 11, 'September usage'],
      ['Coffee & lunch', 48.75, 'expense', 'Food', 14, 'Team lunch'],
      ['Index fund dividend', 236.4, 'income', 'Investment', 18, 'Quarterly distribution'],
      ['Health check-up', 120, 'expense', 'Health', 22, ''],
      ['Monthly salary', 5200, 'income', 'Salary', 35, 'September payroll'],
      ['Weekend groceries', 210.16, 'expense', 'Food', 39, ''],
      ['Online course', 149, 'expense', 'Education', 47, 'Data visualization'],
      ['Apartment rent', 1450, 'expense', 'Housing', 62, ''],
      ['Monthly salary', 5200, 'income', 'Salary', 66, 'August payroll'],
      ['Concert tickets', 190, 'expense', 'Entertainment', 77, '']
    ];

    S.transactions = demo.map(([title, amount, type, category, offset, note], index) => ({
      id: `seed_${index + 1}`,
      title,
      amount,
      type,
      category,
      date: Utils.dateFromOffset(offset),
      note
    }));
    try {
      localStorage.setItem(CFG.seededKey, 'true');
    } catch {
      /* Persistence failure is handled by Store.save. */
    }
    Store.save();
  };

  /* -------------------------------------------------------------------------- */
  /* Toasts and modal                                                            */
  /* -------------------------------------------------------------------------- */
  const Toast = {
    show(message, type = 'info') {
      const region = $('#toastRegion');
      if (!region) return;
      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
      toast.innerHTML = `<svg class="icon toast__icon"><use href="#icon-${type === 'error' ? 'close' : type === 'success' ? 'trend-up' : 'info'}"></use></svg><span>${Utils.esc(message)}</span>`;
      region.append(toast);
      window.setTimeout(() => {
        toast.classList.add('is-leaving');
        window.setTimeout(() => toast.remove(), 220);
      }, 3600);
    }
  };

  const Modal = {
    open({ title, message, action }) {
      const modal = $('#confirmModal');
      const backdrop = $('#modalBackdrop');
      if (!modal || !backdrop) return;
      S.lastFocus = document.activeElement;
      Utils.setText('confirmTitle', title);
      Utils.setText('confirmMessage', message);
      S.confirmAction = action;
      modal.hidden = false;
      backdrop.hidden = false;
      document.body.classList.add('modal-open');
      $('[data-modal-cancel]', modal)?.focus();
    },

    close() {
      const modal = $('#confirmModal');
      const backdrop = $('#modalBackdrop');
      if (!modal || !backdrop) return;
      modal.hidden = true;
      backdrop.hidden = true;
      document.body.classList.remove('modal-open');
      S.confirmAction = null;
      S.lastFocus?.focus();
    },

    confirm() {
      const action = S.confirmAction;
      this.close();
      if (typeof action === 'function') action();
    },

    init() {
      $('[data-modal-cancel]')?.addEventListener('click', () => this.close());
      $('[data-modal-confirm]')?.addEventListener('click', () => this.confirm());
      $('#modalBackdrop')?.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (event) => {
        const modal = $('#confirmModal');
        if (modal?.hidden) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
        }
        if (event.key !== 'Tab') return;
        const focusable = Utils.focusables(modal);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Validation, form and transaction operations                                 */
  /* -------------------------------------------------------------------------- */
  const Validate = {
    fields: {
      title: { input: () => $('#transactionTitle'), error: 'titleError', message: 'Add a title.' },
      amount: { input: () => $('#transactionAmount'), error: 'amountError', message: 'Enter an amount greater than zero.' },
      date: { input: () => $('#transactionDate'), error: 'dateError', message: 'Choose a date.' },
      category: { input: () => $('#transactionCategory'), error: 'categoryError', message: 'Choose a category.' }
    },

    one(key) {
      const field = this.fields[key];
      const input = field.input();
      const error = document.getElementById(field.error);
      if (!input) return false;
      const value = input.value.trim();
      const valid = key === 'amount' ? Number(value) > 0 : Boolean(value);
      input.setAttribute('aria-invalid', String(!valid));
      if (error) error.textContent = valid ? '' : field.message;
      return valid;
    },

    form() {
      return Object.keys(this.fields).map((key) => this.one(key)).every(Boolean);
    }
  };

  const Form = {
    refreshCategories() {
      const select = $('#transactionCategory');
      if (!select) return;
      const current = select.value;
      select.innerHTML = CFG.categories[S.formType].map((category) => `<option value="${Utils.esc(category.name)}">${category.emoji} ${Utils.esc(category.name)}</option>`).join('');
      if (CFG.categories[S.formType].some((category) => category.name === current)) select.value = current;
    },

    setType(type) {
      S.formType = type;
      $$('[data-transaction-type]').forEach((button) => {
        const active = button.dataset.transactionType === type;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      this.refreshCategories();
    },

    reset() {
      const form = $('#transactionForm');
      form?.reset();
      $('#transactionDate').value = Utils.today();
      $$('.form-error').forEach((error) => { error.textContent = ''; });
      $$('[aria-invalid="true"]', form).forEach((input) => input.removeAttribute('aria-invalid'));
      this.setType('income');
    },

    submit(event) {
      event.preventDefault();
      if (!Validate.form()) {
        const invalid = $('[aria-invalid="true"]', event.currentTarget);
        invalid?.focus();
        return;
      }
      const transaction = {
        id: Utils.randomId(),
        title: $('#transactionTitle').value.trim(),
        amount: Number($('#transactionAmount').value),
        type: S.formType,
        category: $('#transactionCategory').value,
        date: $('#transactionDate').value,
        note: $('#transactionNote').value.trim()
      };
      S.transactions.push(transaction);
      Store.save();
      Render.all();
      this.reset();
      Utils.setText('formStatus', 'Transaction added.');
      $('#formStatus').dataset.state = 'success';
      Toast.show('Transaction added successfully.', 'success');
    },

    init() {
      this.setType('income');
      $('#transactionDate').value = Utils.today();
      $$('[data-transaction-type]').forEach((button) => button.addEventListener('click', () => this.setType(button.dataset.transactionType)));
      $('#transactionForm')?.addEventListener('submit', (event) => this.submit(event));
      Object.keys(Validate.fields).forEach((key) => Validate.fields[key].input()?.addEventListener('blur', () => Validate.one(key)));
    }
  };

  const Txns = {
    sorted(items = S.transactions) {
      return [...items].sort((a, b) => {
        if (S.sort === 'oldest') return a.date.localeCompare(b.date);
        if (S.sort === 'amount-asc') return Number(a.amount) - Number(b.amount);
        if (S.sort === 'amount-desc') return Number(b.amount) - Number(a.amount);
        return b.date.localeCompare(a.date);
      });
    },

    filtered() {
      const query = S.query.toLowerCase();
      return S.transactions.filter((transaction) => {
        const filterMatch = S.filter === 'all' || transaction.type === S.filter;
        const queryMatch = !query || [transaction.title, transaction.category, transaction.note].join(' ').toLowerCase().includes(query);
        return filterMatch && queryMatch;
      });
    },

    periodItems(period = S.period) {
      const now = new Date(`${Utils.today()}T12:00:00`);
      const start = new Date(now);
      if (period === 'month') start.setMonth(start.getMonth(), 1);
      if (period === 'quarter') start.setMonth(start.getMonth() - 2, 1);
      if (period === 'year') start.setMonth(0, 1);
      const iso = start.toISOString().slice(0, 10);
      return S.transactions.filter((transaction) => transaction.date >= iso && transaction.date <= Utils.today());
    },

    remove(id) {
      const row = document.querySelector(`[data-transaction-row="${CSS.escape(id)}"]`);
      row?.classList.add('is-removing');
      window.setTimeout(() => {
        S.transactions = S.transactions.filter((transaction) => transaction.id !== id);
        Store.save();
        Render.all();
        Toast.show('Transaction deleted.', 'info');
      }, 220);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Rendering                                                                   */
  /* -------------------------------------------------------------------------- */
  const Render = {
    animatedText(id, value) {
      const element = document.getElementById(id);
      if (!element) return;
      element.classList.remove('number-swap');
      element.textContent = value;
      void element.offsetWidth;
      element.classList.add('number-swap');
    },

    transactionRow(transaction) {
      const category = Utils.category(transaction.type, transaction.category);
      const amountPrefix = transaction.type === 'income' ? '+' : '−';
      return `<div class="transaction-row" data-transaction-row="${Utils.esc(transaction.id)}"><span class="transaction-row__category" title="${Utils.esc(transaction.category)}">${category.emoji}</span><div class="transaction-row__main"><div class="transaction-row__title">${Utils.esc(transaction.title)}</div>${transaction.note ? `<div class="transaction-row__note">${Utils.esc(transaction.note)}</div>` : ''}</div><span class="category-badge transaction-row__category-badge">${Utils.esc(transaction.category)}</span><time class="transaction-row__date" datetime="${Utils.esc(transaction.date)}">${Utils.esc(Utils.dateLabel(transaction.date))}</time><strong class="transaction-row__amount transaction-row__amount--${transaction.type}">${amountPrefix}${Utils.currency(transaction.amount)}</strong><button class="transaction-row__delete" type="button" data-delete-id="${Utils.esc(transaction.id)}" aria-label="Delete ${Utils.esc(transaction.title)}"><svg class="icon"><use href="#icon-trash"></use></svg></button></div>`;
    },

    list(items, target, empty) {
      if (!target) return;
      const sorted = this.grouped(items);
      target.innerHTML = sorted.map((group) => `<div class="transaction-group"><div class="transaction-group__heading">${Utils.esc(group.label)}</div>${group.items.map((item) => this.transactionRow(item)).join('')}</div>`).join('');
      if (empty) empty.hidden = items.length > 0;
      target.hidden = items.length === 0;
    },

    grouped(items) {
      const groups = new Map();
      this.sorted(items).forEach((transaction) => {
        if (!groups.has(transaction.date)) groups.set(transaction.date, []);
        groups.get(transaction.date).push(transaction);
      });
      return [...groups.entries()].map(([date, groupItems]) => ({ label: Utils.groupLabel(date), items: groupItems }));
    },

    profile() {
      const name = S.settings.name || 'Alex Kim';
      const email = S.settings.email || 'alex@flowledger.app';
      const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
      ['sidebarName', 'headerName', 'menuName', 'settingsProfileName'].forEach((id) => Utils.setText(id, name));
      ['sidebarEmail', 'menuEmail'].forEach((id) => Utils.setText(id, email));
      ['sidebarAvatar', 'headerAvatar', 'menuAvatar', 'settingsAvatar'].forEach((id) => Utils.setText(id, initials));
      Utils.setText('greetingName', name.split(' ')[0]);
      Utils.setText('amountCurrency', Utils.symbol());
    },

    kpis() {
      const items = Txns.periodItems();
      const income = Utils.sum(items, 'income');
      const expense = Utils.sum(items, 'expense');
      const balance = income - expense;
      const savings = income ? (balance / income) * 100 : 0;
      this.animatedText('kpiBalance', Utils.currency(balance));
      this.animatedText('kpiIncome', Utils.currency(income));
      this.animatedText('kpiExpense', Utils.currency(expense));
      this.animatedText('kpiSavings', Utils.percent(savings));
      Utils.setText('incomeCount', `${items.filter((item) => item.type === 'income').length} deposits`);
      Utils.setText('expenseCount', `${items.filter((item) => item.type === 'expense').length} payments`);
      Utils.setText('savingsMeta', income ? `${Utils.currency(balance, true)} retained` : 'Based on current period');
      const progress = $('#savingsProgress');
      if (progress) progress.style.width = `${Utils.clamp(savings)}%`;
    },

    transactions() {
      const recent = Txns.sorted().slice(0, 5);
      this.list(recent, $('#recentTransactions'), $('#recentEmpty'));
      const filtered = Txns.filtered();
      this.list(filtered, $('#transactionsList'), $('#transactionsEmpty'));
      Utils.setText('transactionCountText', `${filtered.length} of ${S.transactions.length} transactions`);
      Utils.setText('navTransactionCount', S.transactions.length);
      Utils.setText('allFilterCount', S.transactions.length);
      Utils.setText('incomeFilterCount', S.transactions.filter((item) => item.type === 'income').length);
      Utils.setText('expenseFilterCount', S.transactions.filter((item) => item.type === 'expense').length);
      $$('[data-filter]').forEach((button) => {
        const active = button.dataset.filter === S.filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    },

    categoryProgress() {
      const target = $('#categoryProgress');
      if (!target) return;
      const expenses = S.transactions.filter((item) => item.type === 'expense');
      const totals = new Map();
      expenses.forEach((item) => totals.set(item.category, (totals.get(item.category) || 0) + Number(item.amount)));
      const total = Utils.sum(expenses);
      const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      target.innerHTML = rows.map(([name, amount]) => {
        const category = Utils.category('expense', name);
        const percentage = total ? (amount / total) * 100 : 0;
        return `<div class="category-progress"><div class="category-progress__header"><span class="category-progress__label"><i style="--bar-color: ${category.color}"></i>${Utils.esc(name)}</span><span class="category-progress__amount">${Utils.currency(amount)}</span></div><div class="category-progress__track"><span class="category-progress__fill" data-progress="${percentage}" style="--bar-color: ${category.color}"></span></div><div class="category-progress__values"><span>${percentage.toFixed(1)}% of total</span><span>${expenses.filter((item) => item.category === name).length} entries</span></div></div>`;
      }).join('');
      requestAnimationFrame(() => $$('[data-progress]', target).forEach((bar) => { bar.style.width = `${bar.dataset.progress}%`; }));
    },

    analyticsMetrics() {
      const income = Utils.sum(S.transactions, 'income');
      const expense = Utils.sum(S.transactions, 'expense');
      const months = Math.max(1, Utils.activeMonths(S.transactions));
      const expenses = S.transactions.filter((item) => item.type === 'expense');
      const largest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
      const monthly = this.monthlyData(6);
      const best = monthly.income.map((value, index) => ({ value: value - monthly.expense[index], label: monthly.labels[index] })).sort((a, b) => b.value - a.value)[0];
      Utils.setText('metricAvgIncome', Utils.currency(income / months, true));
      Utils.setText('metricAvgExpense', Utils.currency(expense / months, true));
      Utils.setText('metricLargestExpense', largest ? Utils.currency(largest.amount, true) : Utils.currency(0));
      Utils.setText('metricLargestExpenseName', largest ? largest.title : 'No expenses yet');
      Utils.setText('metricBestMonth', best?.label || '—');
      Utils.setText('metricBestMonthValue', best ? `${Utils.currency(best.value, true)} retained` : 'No data yet');
      Utils.setText('donutIncome', Utils.currency(income, true));
      Utils.setText('donutExpense', Utils.currency(expense, true));
      Utils.setText('donutBalance', Utils.currency(income - expense, true));
      Utils.setText('radialAvailable', Utils.currency(Math.max(0, income - expense), true));
      Utils.setText('radialActivityCount', S.transactions.length);
      const savings = income ? ((income - expense) / income) * 100 : 0;
      const incomeUsed = income ? (expense / income) * 100 : 0;
      const budget = Math.max(0, 100 - (expense / 5000) * 100);
      const coverage = Utils.clamp((S.transactions.length / 20) * 100);
      [['radialSavingsValue', savings], ['radialIncomeValue', incomeUsed], ['radialBudgetValue', budget], ['radialActivityValue', coverage]].forEach(([id, value]) => Utils.setText(id, `${Math.round(Utils.clamp(value))}%`));
      Utils.setText('analyticsDateRange', `${Utils.activeMonths(S.transactions) || 0} active months`);
      return { savings, incomeUsed, budget, coverage };
    },

    monthlyData(count = 6) {
      const now = new Date(`${Utils.today()}T12:00:00`);
      const keys = [];
      for (let index = count - 1; index >= 0; index -= 1) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - index, 1);
        keys.push(date.toISOString().slice(0, 7));
      }
      const income = keys.map((key) => Utils.sum(S.transactions.filter((item) => Utils.monthKey(item.date) === key), 'income'));
      const expense = keys.map((key) => Utils.sum(S.transactions.filter((item) => Utils.monthKey(item.date) === key), 'expense'));
      const realMonths = new Set(S.transactions.map((item) => Utils.monthKey(item.date))).size;
      if (realMonths < 3) return { labels: CFG.demoWave.labels, income: CFG.demoWave.income, expense: CFG.demoWave.expense, fallback: true };
      return { labels: keys.map((key) => Utils.monthLabel(key)), income, expense, fallback: false };
    },

    topCategories() {
      const target = $('#topCategories');
      if (!target) return;
      const totals = new Map();
      S.transactions.filter((item) => item.type === 'expense').forEach((item) => totals.set(item.category, (totals.get(item.category) || 0) + Number(item.amount)));
      target.innerHTML = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, amount]) => `<div class="top-category-row"><span>${Utils.esc(name)}</span><strong>${Utils.currency(amount, true)}</strong></div>`).join('');
    },

    all() {
      this.profile();
      this.kpis();
      this.transactions();
      this.categoryProgress();
      this.analyticsMetrics();
      this.topCategories();
      Charts.refresh();
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Chart.js helpers and chart lifecycle                                        */
  /* -------------------------------------------------------------------------- */
  const ChartUtils = {
    colors() {
      const styles = getComputedStyle(document.documentElement);
      return {
        text: styles.getPropertyValue('--text-muted').trim(),
        main: styles.getPropertyValue('--text-main').trim(),
        grid: styles.getPropertyValue('--grid-line').trim(),
        surface: styles.getPropertyValue('--bg-surface').trim(),
        income: styles.getPropertyValue('--income').trim(),
        expense: styles.getPropertyValue('--expense').trim(),
        accent: styles.getPropertyValue('--accent').trim(),
        cyan: styles.getPropertyValue('--cyan').trim(),
        amber: styles.getPropertyValue('--amber').trim(),
        violet: styles.getPropertyValue('--violet').trim(),
        faint: styles.getPropertyValue('--text-faint').trim()
      };
    },

    hexAlpha(hex, alpha) {
      if (hex.startsWith('rgb')) return hex;
      const value = hex.replace('#', '');
      const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
      const number = parseInt(full, 16);
      return `rgba(${number >> 16}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
    },

    makeGradient(context, top, bottom) {
      const gradient = context.createLinearGradient(0, 0, 0, context.canvas.height || 260);
      gradient.addColorStop(0, top);
      gradient.addColorStop(1, bottom);
      return gradient;
    },

    baseTooltip(isDark) {
      return {
        enabled: true,
        backgroundColor: isDark ? '#151c2c' : '#ffffff',
        borderColor: isDark ? 'rgba(255,255,255,.1)' : 'rgba(25,45,75,.14)',
        borderWidth: 1,
        titleColor: isDark ? '#e7edf7' : '#1c2736',
        bodyColor: isDark ? '#aab4c5' : '#566579',
        padding: 10,
        cornerRadius: 6,
        titleFont: { family: 'Outfit', size: 11, weight: '600' },
        bodyFont: { family: 'IBM Plex Mono', size: 10 },
        callbacks: { label: (context) => `${context.dataset.label}: ${Utils.currency(context.parsed.y ?? context.parsed)}` }
      };
    },

    baseScales(theme, yFormatter = (value) => Utils.currency(value, true)) {
      return {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: theme.text, font: { family: 'IBM Plex Mono', size: 9 }, padding: 7 } },
        y: { beginAtZero: true, grid: { color: theme.grid, drawTicks: false }, border: { display: false }, ticks: { color: theme.text, font: { family: 'IBM Plex Mono', size: 9 }, padding: 7, maxTicksLimit: 5, callback: yFormatter } }
      };
    },

    glowPlugin: {
      id: 'flowGlow',
      afterDatasetsDraw(chart) {
        const context = chart.ctx;
        chart.data.datasets.forEach((dataset, index) => {
          const meta = chart.getDatasetMeta(index);
          if (meta.hidden || !meta.data.length || dataset.type === 'bar') return;
          context.save();
          context.beginPath();
          meta.data.forEach((point, pointIndex) => {
            const position = point.getProps(['x', 'y'], true);
            if (pointIndex === 0) context.moveTo(position.x, position.y);
            else context.lineTo(position.x, position.y);
          });
          context.shadowColor = dataset.borderColor;
          context.shadowBlur = 8;
          context.strokeStyle = dataset.borderColor;
          context.lineWidth = 1.2;
          context.stroke();
          context.restore();
        });
      }
    },

    radialTipPlugin: {
      id: 'radialTip',
      afterDatasetsDraw(chart) {
        const meta = chart.getDatasetMeta(0);
        const arc = meta?.data?.[0];
        if (!arc) return;
        const context = chart.ctx;
        const angle = arc.endAngle;
        const radius = (arc.outerRadius + arc.innerRadius) / 2;
        const x = arc.x + Math.cos(angle) * radius;
        const y = arc.y + Math.sin(angle) * radius;
        context.save();
        context.beginPath();
        context.arc(x, y, 3, 0, Math.PI * 2);
        context.fillStyle = chart.data.datasets[0].backgroundColor[0];
        context.shadowColor = context.fillStyle;
        context.shadowBlur = 9;
        context.fill();
        context.restore();
      }
    },

    options(scales, tooltip, legend = false) {
      return { responsive: true, maintainAspectRatio: false, animation: { duration: 850, easing: 'easeOutQuart' }, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { display: legend }, tooltip }, scales, elements: { line: { tension: 0.45 }, point: { radius: 0, hoverRadius: 4, hoverBorderWidth: 2 } } };
    }
  };

  const Charts = {
    destroyAll() {
      S.charts.forEach((chart) => chart.destroy());
      S.charts.clear();
    },

    put(id, config) {
      const canvas = document.getElementById(id);
      if (!canvas || !window.Chart) return;
      const chart = new window.Chart(canvas, config);
      S.charts.set(id, chart);
    },

    lineConfig(id, labels, income, expense, wave = false) {
      const theme = ChartUtils.colors();
      const canvas = document.getElementById(id);
      const context = canvas?.getContext('2d');
      const incomeFill = context ? ChartUtils.makeGradient(context, ChartUtils.hexAlpha(theme.income, 0.25), ChartUtils.hexAlpha(theme.income, 0.01)) : theme.income;
      const expenseFill = context ? ChartUtils.makeGradient(context, ChartUtils.hexAlpha(theme.expense, 0.2), ChartUtils.hexAlpha(theme.expense, 0.01)) : theme.expense;
      return { type: 'line', data: { labels, datasets: [{ label: 'Income', data: income, borderColor: theme.income, backgroundColor: incomeFill, fill: true, borderWidth: 2, tension: wave ? 0.48 : 0.4 }, { label: 'Expenses', data: expense, borderColor: theme.expense, backgroundColor: expenseFill, fill: true, borderWidth: 2, tension: wave ? 0.45 : 0.4 }] }, options: ChartUtils.options(ChartUtils.baseScales(theme), ChartUtils.baseTooltip(document.documentElement.dataset.theme !== 'light')), plugins: [ChartUtils.glowPlugin] };
    },

    radialConfig(value, color, label) {
      const theme = ChartUtils.colors();
      const percent = Utils.clamp(value);
      return { type: 'doughnut', data: { labels: [label, 'Remaining'], datasets: [{ data: [percent, 100 - percent], backgroundColor: [color, ChartUtils.hexAlpha(theme.faint, 0.2)], borderWidth: 0, borderRadius: 8, spacing: 1 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '72%', rotation: -90, circumference: 360, animation: { duration: 900, easing: 'easeOutQuart' }, plugins: { legend: { display: false }, tooltip: { enabled: false } } }, plugins: [ChartUtils.radialTipPlugin] };
    },

    buildDashboard() {
      const data = Render.monthlyData(6);
      const empty = !S.transactions.length;
      const cashEmpty = $('#cashflowEmpty');
      if (cashEmpty) cashEmpty.hidden = !empty;
      if (!empty) this.put('cashflowChart', this.lineConfig('cashflowChart', data.labels, data.income, data.expense, true));
    },

    buildAnalytics() {
      const data = Render.monthlyData(6);
      const empty = !S.transactions.length;
      const waveEmpty = $('#waveEmpty');
      if (waveEmpty) waveEmpty.hidden = !empty;
      if (empty) return;
      this.put('analyticsWave', this.lineConfig('analyticsWave', data.labels, data.income, data.expense, true));
      this.put('analyticsLine', this.lineConfig('analyticsLine', data.labels, data.income, data.expense));
      const theme = ChartUtils.colors();
      const quarterMap = new Map();
      S.transactions.forEach((transaction) => {
        const key = Utils.quarterKey(transaction.date);
        if (!quarterMap.has(key)) quarterMap.set(key, { income: 0, expense: 0 });
        quarterMap.get(key)[transaction.type] += Number(transaction.amount);
      });
      const quarters = [...quarterMap.keys()].slice(-4);
      this.put('analyticsBar', { type: 'bar', data: { labels: quarters, datasets: [{ label: 'Income', data: quarters.map((key) => quarterMap.get(key).income), backgroundColor: theme.income, borderRadius: 5, borderSkipped: false, barPercentage: 0.52, categoryPercentage: 0.68 }, { label: 'Expenses', data: quarters.map((key) => quarterMap.get(key).expense), backgroundColor: theme.expense, borderRadius: 5, borderSkipped: false, barPercentage: 0.52, categoryPercentage: 0.68 }] }, options: { ...ChartUtils.options(ChartUtils.baseScales(theme), ChartUtils.baseTooltip(document.documentElement.dataset.theme !== 'light')), scales: { ...ChartUtils.baseScales(theme), x: { ...ChartUtils.baseScales(theme).x, stacked: false }, y: { ...ChartUtils.baseScales(theme).y, beginAtZero: true } }, plugins: { legend: { display: false }, tooltip: ChartUtils.baseTooltip(document.documentElement.dataset.theme !== 'light') } } });
      const metrics = Render.analyticsMetrics();
      this.put('radialSavings', this.radialConfig(metrics.savings, theme.accent, 'Savings rate'));
      this.put('radialIncome', this.radialConfig(metrics.incomeUsed, theme.income, 'Income used'));
      this.put('radialBudget', this.radialConfig(metrics.budget, theme.amber, 'Budget health'));
      this.put('radialActivity', this.radialConfig(metrics.coverage, theme.violet, 'Data coverage'));
      this.put('incomeExpenseDonut', { type: 'doughnut', data: { labels: ['Income', 'Expenses'], datasets: [{ data: [Utils.sum(S.transactions, 'income'), Utils.sum(S.transactions, 'expense')], backgroundColor: [theme.income, theme.expense], borderWidth: 0, spacing: 2, borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', animation: { duration: 850 }, plugins: { legend: { display: false }, tooltip: ChartUtils.baseTooltip(document.documentElement.dataset.theme !== 'light') } } });
    },

    refresh() {
      if (!window.Chart) return;
      this.destroyAll();
      this.buildDashboard();
      this.buildAnalytics();
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Navigation, filters, settings and theme                                    */
  /* -------------------------------------------------------------------------- */
  const Nav = {
    labels: { dashboard: 'Dashboard', transactions: 'Transactions', analytics: 'Analytics', settings: 'Settings' },

    go(view) {
      if (!this.labels[view]) return;
      S.view = view;
      $$('[data-view]').forEach((section) => { section.hidden = section.dataset.view !== view; section.classList.toggle('is-active', section.dataset.view === view); });
      $$('[data-view-target]').forEach((item) => {
        if (item.classList.contains('nav-item')) {
          const active = item.dataset.viewTarget === view;
          item.classList.toggle('is-active', active);
          if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
        }
      });
      Utils.setText('breadcrumbCurrent', this.labels[view]);
      ProfileMenu.close();
      Sidebar.close();
      Charts.refresh();
      if (view === 'transactions') $('#transactionSearch')?.focus();
    },

    init() {
      document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-view-target]');
        if (!target) return;
        event.preventDefault();
        this.go(target.dataset.viewTarget);
      });
    }
  };

  const Sidebar = {
    open() {
      $('#sidebar')?.classList.add('is-open');
      $('#sidebarOverlay').hidden = false;
      document.body.classList.add('drawer-open');
      S.drawerOpen = true;
      $('#sidebarClose')?.focus();
    },

    close() {
      $('#sidebar')?.classList.remove('is-open');
      $('#sidebarOverlay').hidden = true;
      document.body.classList.remove('drawer-open');
      S.drawerOpen = false;
    },

    init() {
      $('#mobileMenu')?.addEventListener('click', () => this.open());
      $('#sidebarClose')?.addEventListener('click', () => this.close());
      $('#sidebarOverlay')?.addEventListener('click', () => this.close());
    }
  };

  const ProfileMenu = {
    close() {
      const menu = $('#profileMenu');
      if (!menu) return;
      menu.hidden = true;
      $$('[data-profile-toggle]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    },

    toggle() {
      const menu = $('#profileMenu');
      if (!menu) return;
      const open = menu.hidden;
      menu.hidden = !open;
      $$('[data-profile-toggle]').forEach((button) => button.setAttribute('aria-expanded', String(open)));
      if (open) $('[role="menuitem"]', menu)?.focus();
    },

    init() {
      $$('[data-profile-toggle]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); this.toggle(); }));
      document.addEventListener('click', (event) => { if (!event.target.closest('.profile-wrap') && !event.target.closest('.profile-mini')) this.close(); });
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape') this.close(); });
    }
  };

  const Filters = {
    setFilter(filter) {
      S.filter = filter;
      Render.transactions();
    },

    init() {
      $$('[data-filter]').forEach((button) => button.addEventListener('click', () => this.setFilter(button.dataset.filter)));
      $('#transactionSearch')?.addEventListener('input', Utils.debounce((event) => { S.query = event.target.value.trim(); Render.transactions(); }, 180));
      $('#transactionSort')?.addEventListener('change', (event) => { S.sort = event.target.value; Render.transactions(); });
      $('[data-clear-filter]')?.addEventListener('click', () => { S.filter = 'all'; S.query = ''; S.sort = 'newest'; $('#transactionSearch').value = ''; $('#transactionSort').value = 'newest'; Render.transactions(); });
    }
  };

  const Theme = {
    apply(theme = S.settings.theme) {
      S.settings.theme = theme === 'light' ? 'light' : 'dark';
      document.documentElement.dataset.theme = S.settings.theme;
      const dark = S.settings.theme === 'dark';
      const header = $('#headerThemeToggle');
      if (header) { header.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); header.innerHTML = `<svg class="icon"><use href="#icon-${dark ? 'sun' : 'moon'}"></use></svg>`; }
      const settings = $('#settingsThemeToggle');
      if (settings) { settings.setAttribute('aria-checked', String(dark)); settings.setAttribute('aria-label', dark ? 'Turn off dark theme' : 'Turn on dark theme'); }
      Store.save();
      window.setTimeout(() => { Render.all(); }, 0);
    },

    toggle() {
      this.apply(S.settings.theme === 'dark' ? 'light' : 'dark');
    },

    init() {
      this.apply(S.settings.theme);
      $('#headerThemeToggle')?.addEventListener('click', () => this.toggle());
      $('#settingsThemeToggle')?.addEventListener('click', () => this.toggle());
      const density = $('#densityToggle');
      if (density) {
        document.body.classList.toggle('is-compact', S.settings.compact);
        density.setAttribute('aria-checked', String(S.settings.compact));
        density.addEventListener('click', () => { S.settings.compact = !S.settings.compact; document.body.classList.toggle('is-compact', S.settings.compact); density.setAttribute('aria-checked', String(S.settings.compact)); Store.save(); });
      }
    }
  };

  const Settings = {
    profileInit() {
      const form = $('#profileForm');
      if (!form) return;
      $('#profileName').value = S.settings.name;
      $('#profileEmail').value = S.settings.email;
      $('#profileCurrency').value = S.settings.currency;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = $('#profileName').value.trim();
        const email = $('#profileEmail').value.trim();
        if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Utils.setText('profileStatus', 'Enter a valid name and email.');
          $('#profileStatus').dataset.state = 'error';
          return;
        }
        S.settings.name = name;
        S.settings.email = email;
        S.settings.currency = $('#profileCurrency').value;
        Store.save();
        Render.all();
        Utils.setText('profileStatus', 'Changes saved.');
        $('#profileStatus').dataset.state = 'success';
        Toast.show('Profile settings saved.', 'success');
      });
    }
  };

  const Delete = {
    transaction(id) {
      const transaction = S.transactions.find((item) => item.id === id);
      if (!transaction) return;
      Modal.open({ title: 'Delete transaction?', message: `Remove “${transaction.title}” from your records? This cannot be undone.`, action: () => Txns.remove(id) });
    },

    all() {
      if (!S.transactions.length) { Toast.show('There are no transactions to clear.', 'info'); return; }
      Modal.open({ title: 'Clear all data?', message: 'Every transaction will be removed from this browser. Your profile settings will remain.', action: () => { S.transactions = []; Store.save(); Render.all(); Toast.show('All transaction data cleared.', 'success'); } });
    }
  };

  const Export = {
    csv() {
      if (!S.transactions.length) { Toast.show('There are no transactions to export.', 'info'); return; }
      const header = ['Date', 'Type', 'Title', 'Category', 'Amount', 'Note'];
      const rows = S.transactions.map((item) => [item.date, item.type, item.title, item.category, item.amount, item.note].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));
      const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `flowledger-transactions-${Utils.today()}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      Toast.show('CSV export downloaded.', 'success');
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Global events and boot                                                       */
  /* -------------------------------------------------------------------------- */
  const Events = {
    init() {
      document.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('[data-delete-id]');
        if (deleteButton) { event.preventDefault(); Delete.transaction(deleteButton.dataset.deleteId); return; }
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (action === 'export') { ProfileMenu.close(); Export.csv(); }
        if (action === 'clear') { ProfileMenu.close(); Delete.all(); }
      });
      $$('[data-open-add]').forEach((button) => button.addEventListener('click', () => { Nav.go('dashboard'); window.setTimeout(() => $('#transactionTitle')?.focus(), 80); }));
      $$('[data-period]').forEach((button) => button.addEventListener('click', () => { S.period = button.dataset.period; $$('[data-period]').forEach((item) => { const active = item.dataset.period === S.period; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); }); Render.all(); }));
      $('#globalSearch')?.addEventListener('submit', (event) => { event.preventDefault(); S.query = $('#globalSearchInput').value.trim(); $('#transactionSearch').value = S.query; Nav.go('transactions'); Render.transactions(); });
      $('#globalSearchInput')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); $('#globalSearch').requestSubmit(); } });
      document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#globalSearchInput')?.focus(); }
        if (event.key === 'Escape' && S.drawerOpen) Sidebar.close();
      });
    }
  };

  const boot = () => {
    Store.load();
    seed();
    Modal.init();
    Form.init();
    Nav.init();
    Sidebar.init();
    ProfileMenu.init();
    Filters.init();
    Theme.init();
    Settings.profileInit();
    Events.init();
    Render.all();
  };

  boot();
})();
