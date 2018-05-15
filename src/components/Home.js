//@flow
import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import { Link } from 'react-router-dom';
import List, { ListItem, ListItemText } from 'material-ui/List';
import {
  Typography,
  Chip,
  Avatar,
  Button,
  ButtonBase,
  Paper,
  Tooltip
} from 'material-ui';
import {
  InsertChart as ChartIcon,
  Done as VoteIcon,
  Cancel as LogoutIcon,
  Delete as DeleteIcon
} from '@material-ui/icons';

import { auth, googleAuth, myElectionsRef } from '../services';
import ElectionForm from './ElectionForm';
import Vote from './Vote';

const styles = theme => {
  return {
    avatarChip: { backgroundColor: theme.palette.primary.contrastText },
    wrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    results: { minWidth: '60vw' },
    splitWrapper: { display: 'flex', justifyContent: 'space-between' },
    chartIcon: { fontSize: '2.5em' },
    deleteIcon: { paddingLeft: '1em', paddingRight: '1em' }
  };
};

type Props = {
  classes: Object
};

type State = {
  user: ?{ uid: string, displayName: string, photoURL: string, email: string },
  elections: Array<Object>,
  creating: boolean
};

class Home extends Component<Props, State> {
  defaultState = {
    user: null,
    elections: [],
    creating: false
  };

  constructor() {
    super();
    this.state = this.defaultState;
  }

  componentDidMount() {
    auth.onAuthStateChanged(user => {
      if (user) {
        this.setState({ user });
        this.watchMyElections(user.uid);
      } else {
        this.setState(this.defaultState);
      }
    });
  }

  // MWCTODO: call this from a confirm dialog, not directly from button click.
  deleteMyElection = electionKey => {
    const updates = {};

    // MWCTODO: this fails with a permission error: FIREBASE WARNING: update at / failed: permission_denied
    // suspecting that "update at /" means we're ignoring the detail rules and looking at the root rule only.
    // proberly, we will need to make these as separate updates.

    updates[electionKey] = null;
    console.log(updates);

    // updates['/elections/' + electionKey] = null;
    // updates['/candidates/' + electionKey] = null;
    // updates['/votes/' + electionKey] = null;
    Vote.votesRef(electionKey).remove();
    //    Vote.candidatesRef(electionKey).remove();

    // database.ref().update(updates)
    //   .then(result => {
    //     const remainingElections = this.state.elections.filter(e => e.id !== electionKey);
    //     this.setState({ elections: remainingElections })
    //   })
    //   .catch(err => {
    //     console.error(err);
    //     // MWCTODO: snackbar here? a RED one.
    //   });
  };

  watchMyElections = uid => {
    myElectionsRef(uid).on('value', snapshot => {
      const electionsVal = snapshot.val();
      let elections = [];
      if (electionsVal && this.state.user) {
        elections = Object.keys(electionsVal).map(key => {
          return { id: key, title: electionsVal[key].title };
        });
      }
      this.setState({ elections });
    });
  };

  login = async () => {
    try {
      const result = await auth.signInWithPopup(googleAuth);
      this.setState({ user: result.user });
      this.watchMyElections(result.user.uid);
    } catch (e) {
      console.log('LOGIN FAILED: ', e.stack);
      alert('login failed');
    }
  };

  logout = async () => {
    try {
      await auth.signOut();
      this.setState(this.defaultState);
    } catch (e) {
      console.log('LOGOUT FAILED: ', e);
      alert('logout failed');
    }
  };

  render() {
    const { user, elections, creating } = this.state;
    const { classes } = this.props;

    return (
      <div>
        <div className={classes.splitWrapper}>
          <div>
            {user ? (
              <Tooltip
                title={`Logged in with ${user.email}. Click 'x' to logout`}
              >
                <Chip
                  className={classes.avatarChip}
                  avatar={<Avatar src={user.photoURL} />}
                  deleteIcon={<LogoutIcon />}
                  label={user.displayName}
                  onDelete={this.logout}
                />
              </Tooltip>
            ) : (
              <Button onClick={this.login}>Log In</Button>
            )}
          </div>
          {user &&
            !creating && (
              <div>
                <Tooltip title="Create an Election">
                  <Button
                    variant="raised"
                    color="secondary"
                    onClick={() => this.setState({ creating: true })}
                  >
                    Create an Election
                  </Button>
                </Tooltip>
              </div>
            )}
        </div>
        <div className={classes.wrapper}>
          {user &&
            creating && (
              <ElectionForm
                user={user}
                onCancel={() => this.setState({ creating: false })}
              />
            )}
        </div>

        <div className={classes.wrapper}>
          {user &&
            !creating && (
              <div className={classes.results}>
                <Paper>
                  <Typography variant="title" align="center">
                    Elections
                  </Typography>
                  <List component="nav">
                    {elections.map((election, i) => (
                      <ListItem key={i} divider>
                        <Tooltip title="View Results">
                          <ButtonBase
                            component={Link}
                            to={`/monitor/${election.id}/round/1`}
                          >
                            <ChartIcon
                              className={classes.chartIcon}
                              color="primary"
                            />
                          </ButtonBase>
                        </Tooltip>
                        <ListItemText primary={election.title} />
                        <Tooltip title="Vote">
                          <Avatar component={Link} to={`/vote/${election.id}`}>
                            <VoteIcon color="action" />
                          </Avatar>
                        </Tooltip>
                        <Tooltip title="Delete Election Completely">
                          <ButtonBase
                            onClick={() => this.deleteMyElection(election.id)}
                          >
                            <DeleteIcon className={classes.deleteIcon} />
                          </ButtonBase>
                        </Tooltip>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </div>
            )}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(Home);
