import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import NoSsr from '@mui/base/NoSsr';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import _get from 'lodash/get';
import { useUser } from '@supabase/auth-helpers-react';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { supabaseConnection } from '../utils/supabase';
import { useUserContext } from '../contexts/userContext';

export async function getServerSideProps({req, res}) {
  const supabaseServerClient = createServerSupabaseClient({
    req,
    res,
  })
  const {
    data: { user },
  } = await supabaseServerClient.auth.getUser();

  const supabase = supabaseConnection();

  const loggedinUserId = _get(user, 'id', '');
  const { data: shukran, error } = await supabase.rpc('myshukranpoints', {emp_uuid: loggedinUserId});

  const { data: employees, error: empError } = await supabase
  .from('employees')
  .select('*');

  const { data: rewards, error: rewardsError } = await supabase
  .from('rewards')
  .select('*');

  const { data: used_rewards, error: urewardsError } = await supabase
  .from('used_rewards')
  .select('*')
  .or(`uuid.eq.${loggedinUserId},assignee_uuid.eq.${loggedinUserId}`)

  return {props: {employees, rewards, shukran, used_rewards}};
}

export default function Dashboard(props) {
  // console.log(props);
  const [status, setStatus] = useState('');
  const [donatestatus, setDonateStatus] = useState('');
  const [supabase] = useState(() => supabaseConnection());
  const user = useUser();
  const loggedinUser = useUserContext();

  const [availableShukran, setAvailableShukran] = useState(_get(props, 'shukran.0.sum', 0));
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

    if(rewards_transaction) {
      let availableShukranTmp = availableShukran + _get(rewards_transaction, 'accepted', 0) - _get(rewards_transaction, 'donated', 0);
      setAvailableShukran(availableShukranTmp);
    }
  }, [user]);

  const [credentials, setCredentials] = useState({
    'emp' : '',
    'reward': ''
  });

  const [donates, setDonate] = useState({
    'emp' : '',
    'shukran': 0
  });

  const handleChange = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;

    setCredentials((prevState) => ({
      ...prevState,
      [fieldName]: fieldValue
    }));
  };

  const submitReward = async () => {
    if(credentials.emp && credentials.reward) {
      const emp_uuid = credentials.emp;
      const empDataSingle = _get(props, "employees", []).filter(emp => {
        return emp.uuid === emp_uuid;
      })

      const { error } = await supabase
        .from('emp_rewards')
        .insert({
          uuid: emp_uuid,  // who is taking points
          reward_id: credentials.reward,
          assignee_uuid: loggedinUser.uuid,
          hr_uuid: _get(empDataSingle, '0.hr_uuid', ''),
          manager_uuid: _get(empDataSingle, '0.manager_uuid', ''),
        })

      if(!error) {
        setStatus('success');
      } else {
        setStatus('serverError');
      }
    } else {
      setStatus('formError');
    }
  }


  const handleDonateChange = (e) => {
    const fieldName = e.target.name;
    let fieldValue = e.target.value;
    if(fieldName === 'shukran') {
      if(fieldValue < 0) {
        fieldValue = 0;
      }
      if(fieldValue > availableShukran) {
        fieldValue = availableShukran;
      }
    }
    setDonate((prevState) => ({
      ...prevState,
      [fieldName]: fieldValue
    }));
  };

  const donateReward = async () => {
    if(donates.emp && donates.shukran) {
      const { error } = await supabase
        .from('used_rewards')
        .insert({
          uuid: donates.emp,  // who is taking points
          assignee_uuid: loggedinUser.uuid, // Who is giving points
          points: donates.shukran,
          used_for: 'Donated Shukran points'
        })

      if(!error) {
        setAvailableShukran(availableShukran - donates.shukran);
        setDonateStatus('success');
      } else {
        setDonateStatus('serverError');
      }
    } else {
      setDonateStatus('formError');
    }
  }

  return (
    <NoSsr>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Stack spacing={2}>
            <h3>Recognize and Reward</h3>
            {status === 'success' &&
            <Alert severity="success">
              <AlertTitle>Success</AlertTitle>
              Successfully saved!
            </Alert>
            }
            {status === 'serverError' &&
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              Unknown error!
            </Alert>
            }
            {status === 'formError' &&
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              Please fill form!
            </Alert>
            }
            <FormControl fullWidth>
              <InputLabel id="select-label-name">Select name</InputLabel>
              <Select
                labelId="select-label-name"
                name="emp"
                id="select-name"
                value={credentials['emp']}
                label="Select name"
                onChange={handleChange}
              >
                {_get(props, 'employees', []).filter(item => item.uuid !== _get(user, 'id', '')).map(item => <MenuItem value={item.uuid} key={item.uuid}>{item.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="select-label-reward">Select reward</InputLabel>
              <Select
                labelId="select-label-reward"
                name="reward"
                id="select-reward"
                value={credentials['reward']}
                label="Select reward"
                onChange={handleChange}
              >
                {_get(props, 'rewards', []).map(item => <MenuItem value={item.id} key={item.id}>{item.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" size="large" onClick={submitReward}>
              Submit
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6}></Grid>
        <Grid item xs={12} sm={6}>
          <Stack spacing={2}>
            <br />
            <h3>Donate Shukran points</h3>
            {donatestatus === 'success' &&
            <Alert severity="success">
              <AlertTitle>Success</AlertTitle>
              Successfully saved!
            </Alert>
            }
            {donatestatus === 'serverError' &&
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              Unknown error!
            </Alert>
            }
            {donatestatus === 'formError' &&
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              Please fill form!
            </Alert>
            }
            <FormControl fullWidth>
              <InputLabel id="select-label-name">Select name</InputLabel>
              <Select
                labelId="select-label-name"
                name="emp"
                id="select-donate-name"
                value={donates['emp']}
                label="Select name"
                onChange={handleDonateChange}
              >
                {_get(props, 'employees', []).filter(item => item.uuid !== _get(user, 'id', '')).map(item => <MenuItem value={item.uuid} key={item.uuid}>{item.name}</MenuItem>)}
              </Select>
            </FormControl>
            <p>Total available shukran points: <b>{availableShukran}</b></p>
            <FormControl fullWidth>
              <TextField
                fullWidth
                label="Shukran point to donate"
                id="fullWidth"
                type="number"
                min={1}
                max={availableShukran}
                name="shukran"
                value={donates['shukran']}
                onChange={handleDonateChange}
              />
            </FormControl>
            <Button variant="contained" size="large" onClick={donateReward}>
              Submit
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </NoSsr>
  )
}