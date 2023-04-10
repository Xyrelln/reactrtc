import React, { useContext, useState } from 'react'
import { Button, TextField, Grid, Typography, Container, Paper} from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Assignment, Phone, PhoneDisabled } from '@mui/icons-material'

import { SocketContext } from '../Context'

const Sidebar = ({ children }) => {
  const { me, callAccepted, callEnded, name, setName, callUser, leaveCall} = useContext(SocketContext);
  const [idToCall, setIdToCall] = useState('');
  const { classes } = useStyles();

  return (
    <Container className={classes.container}>
      <Paper elevation={10} className={classes.paper}>
        <form className={classes.root} noValidate autoComplete="off">
          <Grid container className={classes.gridContainer}>
            <Grid item xs={12} md={6} className={classes.padding}>
              <Typography gutterBottom variant="h6">Account Info</Typography>
              <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth={true} />
              <CopyToClipboard text={me} className={classes.margin}>
                <Button variant="contained" color="primary" fullWidth={true} startIcon={<Assignment fontSize="large" />}>
                  Copy your ID
                </Button>
              </CopyToClipboard>
            </Grid>
              <Grid item xs={12} md={6} className={classes.padding}>
                <Typography gutterBottom variant="h6">Account Info</Typography>
                <TextField label="ID to Call" value={idToCall} onChange={(e) => setIdToCall(e.target.value)} fullWidth={true} />
                {callAccepted && !callEnded ? (
                  <Button variant="contained" color="secondary" startIcon={<PhoneDisabled fontSize="large" />} fullWidth={true} onClick={leaveCall} className={classes.margin}>
                    Hang Up
                  </Button>
                ) : (
                  <Button variant="contained" color="secondary" startIcon={<Phone fontSize="large" />} fullWidth={true} onClick={() => callUser(idToCall)} className={classes.margin}>
                    Call 
                  </Button>
                )}
              </Grid>
          </Grid> 
        </form>
        { children }
      </Paper>
    </Container>
  )
};

const useStyles = makeStyles({ "name": { Sidebar }})((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  gridContainer: {
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
    },
  },
  container: {
    maxWidth: '600px',
    margin: '35px auto',
    padding: 0,
    [theme.breakpoints.down('xs')]: {
      maxWidth: '80%',
      margin: '20px auto',
    },
  },
  margin: {
    marginTop: 20,
  },
  padding: {
    padding: 20,
  },
  paper: {
    padding: '10px 20px',
    border: '2px solid black',
  },
}));



export default Sidebar;