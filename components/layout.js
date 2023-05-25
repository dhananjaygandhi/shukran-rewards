import React, {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import NoSsr from '@mui/base/NoSsr';
import Container from '@mui/material/Container';
import _get from 'lodash/get';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Header from './header';
import { UserProvider } from './../contexts/userContext';

export default function Layout({children}) {
  const router = useRouter();
  const user = useUser();

  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [loggedUser, setLoggedUser] = React.useState({});
  const getUser = async () => {
    const { data: loggedin, error } = await supabase
      .from('employees')
      .select('*')
      .eq('uuid', user.id)
      .single();

    setLoggedUser(loggedin);
  }

  useEffect(() => {
    user && getUser();
  }, [user]);

  return (
    <UserProvider value={loggedUser}>
      <NoSsr>
      {!(router.pathname === "/" || router.pathname === "/profile") &&
        <Header user={user} />
      }
      <Container maxWidth="xl">
        <Box paddingTop="20px">{children}</Box>
      </Container>
      </NoSsr>
    </UserProvider>
  )
}