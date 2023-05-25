import { useState, useEffect } from "react";
import getConfig from 'next/config';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useRouter } from 'next/router';
import _get from 'lodash/get';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import algoliaSearchApi from '../pages/api/algoliaObject';
import { useUser } from '@supabase/auth-helpers-react';
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

export default function Product(props) {
  const router = useRouter();
  const user = useUser();
  const pid = _get(router, 'query.pid', '');
  const [product, setProduct] = useState([]);
  const [availableShukran, setAvailableShukran] = useState(_get(props, 'shukran.0.sum', 0));
  const conversion = _get(publicRuntimeConfig, 'conversion.shukran', 1000);

  const used_rewards = _get(props, 'used_rewards', []);

  useEffect(() => {
    const algolia = algoliaSearchApi({pid: pid});
      algolia.then(
        function(value) {
          setProduct(_get(value, "hits.0", []))
        },
        function(error) {
          console.log(error);
        }
      );
  }, []);

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
    }
  }, [user]);

  return (
    <>
      <h2>
      <p>Total earned shukran points: {availableShukran}</p>
      </h2>
      <Grid container spacing={2}>
        <Grid item sm={4} xs={12}>
          <img src={product['333WX493H']} width="100%" />
        </Grid>
        <Grid item sm={8} xs={12}>
          <h2>
            {_get(product, "name.en", "")}
          </h2>
          <p className="prod-price">
            {_get(product, "price", "") * conversion} Shukran
          </p>
          <Button variant="contained">Buy Now</Button>
        </Grid>
      </Grid>
    </>
  )
}