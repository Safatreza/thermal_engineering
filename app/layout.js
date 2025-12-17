export const metadata = {
  title: 'Thermal Engineering Data Visualization',
  description: 'Interactive visualization of thermal engineering data with temperature and pressure monitoring',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
