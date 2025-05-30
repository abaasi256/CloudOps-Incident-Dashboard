/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'incident-critical': '#dc2626',
        'incident-high': '#ea580c', 
        'incident-medium': '#ca8a04',
        'incident-low': '#16a34a',
        'status-new': '#6b7280',
        'status-acknowledged': '#2563eb',
        'status-in-progress': '#7c3aed',
        'status-resolved': '#16a34a'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
