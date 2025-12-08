<template>
  <div class="et-shell">
    <header class="et-shell__header">
      <div class="et-shell__brand">Expense Tracker</div>
      <nav class="et-shell__nav">
        <NuxtLink to="/">Dashboard</NuxtLink>
        <NuxtLink to="/transactions">Transactions</NuxtLink>
        <NuxtLink to="/categories">Categories</NuxtLink>
      </nav>
    </header>
    <main class="et-shell__main">
      <div class="et-container">
        <slot />
      </div>
    </main>
  </div>
</template>
