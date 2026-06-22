/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // หากมึงมีโฟลเดอร์อื่นๆ นอกเหนือจากนี้ เช่น leave-system สามารถเพิ่มบรรทัดล่างนี้เข้าไปได้ครับ
    "./leave-system/**/*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounceSlow 3s ease-in-out infinite',
      },
      keyframes: {
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
