import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import _get from 'lodash/get';
import _filter from 'lodash/filter';
import NoSsr from '@mui/base/NoSsr';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { supabaseConnection } from '../utils/supabase';
import styles from '@/styles/Home.module.css';

export async function getServerSideProps(context) {
  const supabase = supabaseConnection();

  const { data: employees, error } = await supabase
  .from('employees')
  .select('*')

  const { data: { user } } = await supabase.auth.getUser()

  return {props: {employees, error, user}};
}

export default function Profile(props) {
  const router = useRouter();
  const employees = _get(props, 'employees', []);
  const user = useUser();
  const [supabase] = useState(() => supabaseConnection());
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    const uuid = _get(user, 'id', '');
    if(uuid.length > 1) {
      const emp = _filter(employees, function(o) { return o.uuid === uuid });
      if(emp.length >= 1) {
        router.push("/dashboard");
      }
    }
  }, [user]);

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    if(value) {
      setInputs(values => ({...values, [name]: value}))
    }
  }

  const submitForm = async () => {
    const { error } = await supabase
      .from('employees')
      .insert({
        ...inputs,
        uuid: _get(user, 'id')
      })

    setSuccess(true);
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if(inputs.name && inputs.department && inputs.role && inputs.manager_uuid && inputs.hr_uuid) {
      setError(false);
      submitForm();
    } else {
      setError(true);
    }
  }

  return (
    <div>
      <div className={styles.description}>
        <h2>
          Employee Rewards Tool
        </h2>
      </div>
      {success && <Alert severity="success">Submitted Successfully!</Alert>}
      {error && <Alert severity="error">Please fill form!</Alert>}
      <h4>Complete your profile</h4>
      <NoSsr>
      <form onSubmit={handleSubmit}>
        <Stack
          sx={{
            width: '50ch',
          }}
          spacing={2}
        >
          <TextField
            required
            id="input-name"
            name="name"
            label="Name"
            onChange={handleChange}
          />
          <TextField
            required
            id="input-department"
            name="department"
            label="Department"
            onChange={handleChange}
          />
          <TextField
            required
            id="input-role"
            name="role"
            label="Role"
            onChange={handleChange}
          />
          <InputLabel id="simple-select-manager">Manager</InputLabel>
          <Select
            labelId="simple-select-manager"
            id="simple-select-manager-s"
            name='manager_uuid'
            value={_get(inputs, 'manager_uuid', '')}
            onChange={handleChange}
            autoWidth
            label="Manager"
          >
            {employees.map((option) => <MenuItem value={option.uuid} key={option.uuid}>{option.name}</MenuItem> )}
          </Select>
          <InputLabel id="simple-select-hr">HR</InputLabel>
          <Select
            labelId="simple-select-hr"
            id="simple-select-hr-s"
            name='hr_uuid'
            value={_get(inputs, 'hr_uuid', '')}
            onChange={handleChange}
            autoWidth
            label="Manager"
          >
            {employees.map((option) => <MenuItem value={option.uuid} key={option.uuid}>{option.name}</MenuItem> )}
          </Select>
          <Button variant="contained" size="large" onClick={handleSubmit}>
            Submit
          </Button>
        </Stack>
      </form>
      </NoSsr>
    </div>
  )
}