import { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import NoSsr from '@mui/base/NoSsr';
import _get from 'lodash/get';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { useUser } from '@supabase/auth-helpers-react';
import { supabaseConnection } from '../utils/supabase';
// import { useUserContext } from '../contexts/userContext';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export async function getServerSideProps({req, res}) {
  const supabaseServerClient = createServerSupabaseClient({
    req,
    res,
  })
  const {
    data: { user },
  } = await supabaseServerClient.auth.getUser();

  const supabase = supabaseConnection();

  const { data: shukran, error: shukranError } = await supabase.rpc('myshukranpoints', {emp_uuid: user.id});

  const { data: emprewards, error: empRewardsError } = await supabase
  .from('emp_rewards')
  .select(`
    id,
    uuid,
    reward_id,
    rewards:reward_id (id, name, value, type),
    employees:uuid (id, name, department, role)
  `)
  .eq('uuid', user.id)
  .eq('manager_status', true)
  .eq('hr_status', true)

  const { data: pendingHrRewards, error: pendingHrRewardsError } = await supabase
  .from('emp_rewards')
  .select(`
    id,
    uuid,
    reward_id,
    hr_status,
    manager_status,
    rewards:reward_id (id, name, value, type),
    employees:uuid (id, name, department, role )
  `)
  .eq('hr_uuid', user.id)
  .is('hr_status', null)

  const { data: pendingManRewards, error: pendingManRewardsError } = await supabase
  .from('emp_rewards')
  .select(`
    id,
    uuid,
    reward_id,
    hr_status,
    manager_status,
    rewards:reward_id (id, name, value, type),
    employees:uuid (id, name, department, role )
  `)
  .eq('manager_uuid', user.id)
  .is('manager_status', null)

  const { data: used_rewards, error: urewardsError } = await supabase
  .from('used_rewards')
  .select('*')
  .or(`uuid.eq.${user.id},assignee_uuid.eq.${user.id}`)

  return {props: {emprewards, pendingHrRewards, pendingManRewards, used_rewards, shukran}};
}

export default function Dashboard(props) {
  const [supabase] = useState(() => supabaseConnection());
  const [approval, setApproval] = useState({});
  const user = useUser();
  // const loggedinUser = useUserContext();

  const empRewards = _get(props, 'emprewards', []);
  const used_rewards = _get(props, 'used_rewards', []);
  const pendingManRewards = _get(props, 'pendingManRewards', []);
  const pendingHrRewards = _get(props, 'pendingHrRewards', []);
  const pendingRewards = [...pendingManRewards, ...pendingHrRewards];

  const [availableShukran, setAvailableShukran] = useState(_get(props, 'shukran.0.sum', 0));

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

  const approveReward = (id, column, status) => async () => {
    const upObj = {
      [column]: status
    };

    const { error } = await supabase
      .from('emp_rewards')
      .update(upObj)
      .eq('id', id)

    if(error) {
      console.log(error);
    } else {
      setApproval({
        ...approval,
        [`${id}`]: status
      })
    }
  }

  return (
    <NoSsr>
      <Stack spacing={2}>
        <h3>Total points earned</h3>
        {(empRewards.length > 0 || used_rewards.length > 0) ?
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Reward</StyledTableCell>
                <StyledTableCell align="right">Points</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empRewards.map((row) => (
                <StyledTableRow key={`empreward-${row.id}`}>
                  <StyledTableCell component="th" scope="row">
                    {_get(row, 'rewards.name', '')}
                  </StyledTableCell>
                  <StyledTableCell align="right">{_get(row, 'rewards.value', '')}</StyledTableCell>
                </StyledTableRow>
              ))}
              {used_rewards.map((row) => (
                (user && row.uuid === user.id) &&
                <StyledTableRow key={`accepted-${row.id}`}>
                  <StyledTableCell component="th" scope="row">
                    Points Accepted
                  </StyledTableCell>
                  <StyledTableCell align="right">{_get(row, 'points', '')}</StyledTableCell>
                </StyledTableRow>
              ))}
              {used_rewards.map((row) => (
                (user && row.assignee_uuid === user.id) &&
                <StyledTableRow key={`donated-${row.id}`}>
                  <StyledTableCell component="th" scope="row">
                    Points Donated
                  </StyledTableCell>
                  <StyledTableCell align="right">-{_get(row, 'points', '')}</StyledTableCell>
                </StyledTableRow>
              ))}
              <StyledTableRow>
                <StyledTableCell component="th" scope="row">
                  <b>Total available Shukran points</b>
                </StyledTableCell>
                <StyledTableCell align="right"><b>{availableShukran}</b></StyledTableCell>
              </StyledTableRow>
            </TableBody>
          </Table>
        </TableContainer>
        :
        <Alert severity="info">You have not earned Shukran points!</Alert>
        }
        <br/>
        <br/>
        {pendingRewards.length > 0 &&
        <>
        <h3>Pending for Approval</h3>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Employee Name</StyledTableCell>
                <StyledTableCell align="right">Department</StyledTableCell>
                <StyledTableCell align="right">Role</StyledTableCell>
                <StyledTableCell align="right">Reward</StyledTableCell>
                <StyledTableCell align="right">Approve</StyledTableCell>
                <StyledTableCell align="right">Reject</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingManRewards.map((row) => (
                <StyledTableRow key={`pending-man-${row.id}`}>
                  <StyledTableCell component="th" scope="row">
                    {_get(row, 'employees.name', '')}
                  </StyledTableCell>
                  <StyledTableCell align="right">{_get(row, 'employees.department', '')}</StyledTableCell>
                  <StyledTableCell align="right">{_get(row, 'employees.role', '')}</StyledTableCell>
                  <StyledTableCell align="right">{_get(row, 'rewards.name', '')}</StyledTableCell>
                  <StyledTableCell align="right">
                    {_get(approval, `${_get(row, 'id')}`, 'na') === 'na' ?
                    <Button variant="outlined" onClick={approveReward(_get(row, 'id'), 'manager_status', true)}>Approve</Button>
                    :
                    _get(approval, `${_get(row, 'id')}`) ? <Chip label="Approved" color="success" /> : <Chip label="Rejected" color="error" />
                    }
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {_get(approval, `${_get(row, 'id')}`, 'na') === 'na' ?
                    <Button variant="outlined" onClick={approveReward(_get(row, 'id'), 'manager_status', false)}>Reject</Button>
                    :
                    _get(approval, `${_get(row, 'id')}`) ? <Chip label="Approved" color="success" /> : <Chip label="Rejected" color="error" />
                    }
                  </StyledTableCell>
                </StyledTableRow>
              ))}
              {pendingHrRewards.map((row) => (
                <StyledTableRow key={`pending-hr-${row.id}`}>
                  <StyledTableCell component="th" scope="row">
                    {_get(row, 'employees.name', '')}
                  </StyledTableCell>
                  <StyledTableCell align="right">{_get(row, 'employees.department', '')}</StyledTableCell>
                  <StyledTableCell align="right">{_get(row, 'employees.role', '')}</StyledTableCell>
                  <StyledTableCell align="right">{_get(row, 'rewards.name', '')}</StyledTableCell>
                  <StyledTableCell align="right">
                    {_get(approval, `${_get(row, 'id')}`, 'na') === 'na' ?
                    <Button variant="outlined" onClick={approveReward(_get(row, 'id'), 'hr_status', true)}>Approve</Button>
                    :
                    _get(approval, `${_get(row, 'id')}`) ? <Chip label="Approved" color="success" /> : <Chip label="Rejected" color="error" />
                    }
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {_get(approval, `${_get(row, 'id')}`, 'na') === 'na' ?
                    <Button variant="outlined" onClick={approveReward(_get(row, 'id'), 'hr_status', false)}>Reject</Button>
                    :
                    _get(approval, `${_get(row, 'id')}`) ? <Chip label="Approved" color="success" /> : <Chip label="Rejected" color="error" />
                    }
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </>
        }
      </Stack>
    </NoSsr>
  )
}