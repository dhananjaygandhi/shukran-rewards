import { useState, useEffect } from "react";
import Link from 'next/link';
import getConfig from 'next/config';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import _get from 'lodash/get';
import { useUser } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import algoliaSearchApi from '../pages/api/algolia';
import { supabaseConnection } from '../utils/supabase';

const { publicRuntimeConfig } = getConfig();

export async function getServerSideProps({req, res}) {
  const supabaseServerClient = createServerSupabaseClient({
    req,
    res,
  })
  const {
    data: { user },
  } = await supabaseServerClient.auth.getUser();

  const loggedinUserId = _get(user, 'id', '');

  const supabase = supabaseConnection();
  const { data: shukran, error } = await supabase.rpc('myshukranpoints', {emp_uuid: _get(user, 'id', '')});

  const { data: used_rewards, error: urewardsError } = await supabase
  .from('used_rewards')
  .select('*')
  .or(`uuid.eq.${loggedinUserId},assignee_uuid.eq.${loggedinUserId}`)

  return {props: {shukran, used_rewards}};
}

export default function Catalogue(props) {
  const [products, setProducts] = useState([]);
  const user = useUser();
  const [availableShukran, setAvailableShukran] = useState(_get(props, 'shukran.0.sum', 0));
  const conversion = _get(publicRuntimeConfig, 'conversion.shukran', 1000);

  // let shukranToAED = Math.round(availableShukran / conversion);

  const used_rewards = _get(props, 'used_rewards', []);

  useEffect(() => {
    const rewards_transaction = used_rewards.reduce((reduced, item) => {
      if(item.uuid === _get(user, 'id')) {
        return {
          ...reduced,
          accepted: reduced.donated + item.points
        };
      }
      if(item.assignee_uuid === _get(user, 'id')) {
        return {
          ...reduced,
          donated: reduced.donated + item.points
        };
      }
      return reduced;
    }, {accepted: 0, donated: 0});

    if(user) {
      let availableShukranTmp = availableShukran + _get(rewards_transaction, 'accepted', 0) - _get(rewards_transaction, 'donated', 0);
      setAvailableShukran(availableShukranTmp);

      const shukranToAED = Math.round(availableShukranTmp / conversion);

      const algolia = algoliaSearchApi({maxPrice: shukranToAED});
      algolia.then(
        function(value) {
          setProducts(_get(value, "hits", []))
        },
        function(error) {
          console.log(error);
        }
      );
    }
  }, [user]);

  const list = products.map((p) => {
    return (
      <Grid item sm={3} xs={6} key={p.objectID}>
        <Link href={`/product?pid=${p.objectID}`} className="product-card">
          <Card sx={{ maxWidth: 345 }}>
            <img src={p['333WX493H']} width="100%" />
            <CardContent>
              <Typography gutterBottom variant="p" component="p">
                {_get(p, 'name.en', '')}
              </Typography>
              <Typography gutterBottom variant="p" component="p" className="prod-price">
                {_get(p, 'price', 0) * conversion} Shukran
              </Typography>
            </CardContent>
          </Card>
        </Link>
      </Grid>
  )});

  return (
    <>
      <h2>
        Catalogue
      </h2>
      {availableShukran ?
      <>
      <p>Total earned shukran points: {availableShukran}</p>
      <Grid container spacing={2}>
        {list}
      </Grid>
      </>
      :
      <>
      <p>Total earned shukran points: 0</p>
      <Alert severity="info">You have not earned shukran points so we are not showing catalogue for you!</Alert>
      </>
      }
    </>
  )
}