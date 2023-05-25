import { useState } from 'react';
import { ThemeProvider } from "@mui/material";
import CssBaseline from '@mui/material/CssBaseline';
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import Layout from '../components/layout';
import { theme } from "../styles/theme";
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession} >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionContextProvider>
  </ThemeProvider>
)}
