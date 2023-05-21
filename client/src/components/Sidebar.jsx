import React, { useContext, useState } from 'react'
import { Button, TextField, Grid, Typography, Container, Paper} from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import { WifiTethering, WifiTetheringOff } from '@mui/icons-material'

import { SocketContext } from '../Context'

const Sidebar = ({ children }) => {
  const { callAccepted, callEnded, callUser, leaveCall} = useContext(SocketContext);
  const [idToCall, setIdToCall] = useState('');
  const { classes } = useStyles();

  return (
    <Container className={classes.container}>
      <Paper elevation={10} className={classes.paper}>
        <form className={classes.root} noValidate autoComplete="off">
          <Grid container className={classes.gridContainer}>
            <Grid item className={classes.padding}>
              <Typography gutterBottom variant="h6">Remote ID</Typography>
              <TextField label="ID to Call" value={idToCall} onChange={(e) => setIdToCall(e.target.value)} fullWidth={true} />
              {callAccepted && !callEnded ? (
                <Button variant="contained" color="secondary" startIcon={<WifiTetheringOff fontSize="large" />} fullWidth={true} onClick={leaveCall} className={classes.margin}>
                  Disconnect
                </Button>
              ) : (
                <Button variant="contained" color="secondary" startIcon={<WifiTethering fontSize="large" />} fullWidth={true} onClick={() => callUser(idToCall)} className={classes.margin}>
                  Connect 
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
  },
  container: {
    maxWidth: '600px',
    margin: '35px auto',
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  margin: {
    marginTop: 20,
  },
  padding: {
    padding: 20,
    width: '100%',
  },
  paper: {
    padding: '10px 20px',
    border: '2px solid black',
    width: '500px',
  },
}));



export default Sidebar;