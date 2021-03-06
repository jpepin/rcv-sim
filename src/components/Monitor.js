//@flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import {
  Avatar,
  Typography,
  Paper,
  Button,
  Tooltip,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Grid
} from '@material-ui/core';
import {
  ArrowBack,
  ArrowForward,
  Done as VoteIcon,
  Home as HomeIcon
} from '@material-ui/icons';

import { database } from '../services';
import { getResults } from '../lib/voteCounter';
import { getResults as getMWResults } from '../lib/wigm';
import Candidate from './chart/Candidate';
import type { Results } from '../lib/voteTypes';

const Green = require('../assets/Green.png');
const Gray = require('../assets/Gray.png');
const Purple = require('../assets/Purple.png');
const Yellow = require('../assets/Yellow.png');
const Orange = require('../assets/Orange.png');
const Blue = require('../assets/Blue.png');
const Pink = require('../assets/Pink.png');

const finishLIne =
  'repeating-linear-gradient(to top, transparent, transparent 3%, #76911d 3%, #76911d 10%)';

const styles = theme => {
  return {
    wrapper: {
      padding: 40
    },
    splitWrapper: { display: 'flex', justifyContent: 'space-between' },
    results: { width: '100%' },
    chartHeader: {
      background: 'transparent',
      height: 30
    },
    chartLabel: {
      transform: 'translate(-100%, 0)'
    },
    chart: {
      display: 'flex'
    },
    bars: {
      width: '75%',
      textAlign: 'right'
    },
    candidateName: {
      textAlign: 'right',
      height: 85
    },
    candidateList: {
      marginTop: 30
    },
    diamond: {
      height: '3.5vh',
      width: '3.5vh',
      transform: 'rotate(45deg)',
      backgroundColor: 'blue'
    },
    electionNotices: {
      paddingTop: 30,
      paddingLeft: 20,
      paddingRight: 20,
      textAlign: 'left',
      minHeight: 130
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'space-around',
      marginTop: 20
    },
    button: {
      fontWeight: 800,
      fontSize: 23,
      padding: 15,
      textTransform: 'capitalize'
    },
    buttonNarrow: {
      width: '25%'
    },
    sectionTitle: {
      color: '#272361',
      fontWeight: 800
    },
    candidateColorRec: {
      height: 15,
      width: 40,
      display: 'inline-block'
    }
  };
};

type Props = {
  match: {
    params: {
      key: string,
      round: string
    }
  },
  classes: Object
};

type State = {
  election?: Object,
  candidates?: Array<Object>,
  votes?: Array<any>,
  results?: Results
};

class Monitor extends Component<Props, State> {
  state = {};

  candidateColors = [
    'Green',
    'Purple',
    'Yellow',
    'Orange',
    'Blue',
    'Gray',
    'Pink'
  ];

  componentDidMount() {
    const { key } = this.props.match.params;
    database.ref(`elections/${key}`).once('value', snapshot => {
      const election = snapshot.val();
      election.id = key;

      this.setState({ election });

      database.ref(`candidates/${key}`).once('value', snapshot => {
        const candidatesData = snapshot.val();
        const candidateIds = Object.keys(candidatesData);
        const candidatesArray = candidateIds.map((key, index) => ({
          id: key,
          name: candidatesData[key].name
        }));

        this.setState({
          candidates: candidatesArray
        });

        //Re-runs the election on every vote. Throttle this ?
        database.ref(`votes/${key}`).on('value', snapshot => {
          if (snapshot.val()) {
            const { numberOfWinners } = this.state.election;
            let results;
            const votes = Object.values(snapshot.val());
            if (numberOfWinners > 1) {
              results = getMWResults(
                votes,
                candidatesArray.map(c => c.id),
                numberOfWinners
              );
            } else {
              results = getResults(votes, candidatesArray.map(c => c.id));
            }
            this.setState({ votes, results });
          }
        });
      });
    });
  }

  renderElectionNotice(
    allWinners,
    numberOfWinners,
    roundInt,
    totalRounds,
    candidates,
    results
  ) {
    // intro text
    if (roundInt === 1) {
      const totalVotesObj = results.rounds[0].totals;
      let winner = 0;
      let winnerID = '';
      let winnerName = '';

      for (const key of Object.keys(totalVotesObj)) {
        if (totalVotesObj[key] > winner) {
          winner = totalVotesObj[key];
          winnerID = key;
        }
      }

      for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].id == winnerID) {
          winnerName = candidates[i].name;
        }
      }

      if (numberOfWinners === 1) {
        return (
          <Typography variant={'h6'}>
            All the votes are in and at first glance this is what our results
            look like. In our current system, {winnerName} would have won.
          </Typography>
        );
      } else {
        return (
          <Typography variant={'h6'}>
            All the votes are in and at first glance this is what our results
            look like.
          </Typography>
        );
      }
      // checking for the most recent loser
    } else if (
      results.rounds[roundInt - 1].previousLosers.length >
        results.rounds[roundInt - 2].previousLosers.length &&
      !(allWinners.length >= numberOfWinners && roundInt === totalRounds)
    ) {
      const previousLosersArr = results.rounds[roundInt - 1].previousLosers;
      const recentLoser = previousLosersArr[previousLosersArr.length - 1];
      let recentLoserName = '';

      for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].id == recentLoser) {
          recentLoserName = candidates[i].name;
        }
      }

      return (
        <Typography variant={'h6'}>
          {recentLoserName} is knocked out because they are in last place this
          round. Their votes are then redistributed to remaining candidates.
        </Typography>
      );
    } else if (
      results.rounds[roundInt - 1].winners.length >
        results.rounds[roundInt - 2].winners.length &&
      !(allWinners.length >= numberOfWinners && roundInt === totalRounds)
    ) {
      const winnersArr = results.rounds[roundInt - 1].winners;
      const recentWinner = winnersArr[winnersArr.length - 1];
      let recentWinnerName = '';

      for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].id == recentWinner) {
          recentWinnerName = candidates[i].name;
        }
      }

      return (
        <Typography variant={'h6'}>
          {recentWinnerName} has just crossed the threshold and is now a winner.
          Any of their extra votes will now be proportionally redistributed.
        </Typography>
      );

      // rendering a list of the winners at the end
    } else if (
      allWinners.length >= numberOfWinners &&
      roundInt === totalRounds
    ) {
      let candidateWinners = '';
      for (let i = 0; i < candidates.length; i++) {
        if (allWinners.includes(candidates[i].id)) {
          candidateWinners += candidates[i].name + ', ';
        }
      }

      let haveVsHas = 'have';
      if (numberOfWinners === 1) {
        let haveVsHas = 'has';
      }

      return (
        <Typography variant={'h6'}>
          With a majority a votes,{' '}
          {candidateWinners.substr(0, candidateWinners.length - 2)} {haveVsHas}{' '}
          won!
        </Typography>
      );
    } else {
      return null;
    }
  }

  render() {
    const { election, votes, candidates, results } = this.state;
    console.log(results);
    const elecKey = this.props.match.params.key;
    let totalRounds = 0;
    if (results) {
      totalRounds = results.rounds.length;
    }
    if (!(election && candidates && votes && results)) {
      return (
        <div class="no-votes-msg">
          <Typography variant="h4">
            It looks like we don't have any votes yet cast for this election.
          </Typography>
          <Typography variant="h6">
            Cast some votes <a href={`/vote/${elecKey}`}>here</a>.
          </Typography>
        </div>
      );
    }

    const firstTotals = results.rounds[0].totals;
    const sortedCandidates = candidates
      .concat()
      .sort((a, b) => firstTotals[b.id] - firstTotals[a.id]);
    const {
      classes,
      match: {
        params: { key, round }
      }
    } = this.props;
    const numberOfWinners = election.numberOfWinners || 1;
    const roundInt = parseInt(round, 10);
    const graphWidthInVotes = results.rounds.reduce((max, round) => {
      Object.values(round.totals).forEach(value => {
        if (value > max) max = value;
      });
      return max;
    }, 0);
    const thisRound = results.rounds[roundInt - 1];
    const totalVotes = thisRound.validVoteCount;
    const votesToWin = totalVotes / (numberOfWinners + 1);
    const nextRound = roundInt + 1;
    const lostVotes = votes.length - totalVotes;
    // prettier-ignore
    const scalar = (10 * totalVotes) / graphWidthInVotes;
    // prettier-ignore
    const graphRulesGradient = `repeating-linear-gradient(to right, #BBB, #BBB 1px, transparent 1px, transparent ${scalar}%)`;
    const colorMap = {};

    sortedCandidates.forEach(
      (candidate, i) => (colorMap[candidate.id] = this.candidateColors[i])
    );

    const allWinners = thisRound.winners;
    const isWinner = candidate => allWinners.includes(candidate.id);

    const getSecondaryText = candidate => {
      if (isWinner(candidate)) return 'Winner';
      if (thisRound.previousLosers.includes(candidate.id)) return 'Eliminated';
      return `${Math.round(
        (thisRound.totals[candidate.id] / totalVotes) * 100
      )}% (${+thisRound.totals[candidate.id].toFixed(2)} votes)`;
    };

    const victoryPercentage = 1 / (numberOfWinners + 1);

    return (
      <div className={classes.wrapper}>
        <div className={classes.results}>
          <Typography variant="h5" className={classes.sectionTitle}>
            {election.title}
          </Typography>
          <Typography
            variant="h4"
            gutterBottom
            className={classes.sectionTitle}
          >
            Round {round}
          </Typography>
          <Grid container>
            <Grid item className={classes.candidateList}>
              <List disablePadding={true}>
                {sortedCandidates.map((candidate, i) => (
                  <ListItem className={classes.candidateName}>
                    <ListItemText
                      primary={candidate.name}
                      primaryTypographyProps={{ noWrap: true }}
                      secondary={
                        <React.Fragment>
                          {getSecondaryText(candidate)}
                          <br />
                          {getSecondaryText(candidate) === 'Eliminated' ? (
                            <div
                              className={classes.candidateColorRec}
                              style={{
                                backgroundImage:
                                  'url(' + eval(this.candidateColors[i]) + ')'
                              }}
                            />
                          ) : null}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
                {lostVotes ? (
                  <ListItem className={classes.candidateName}>
                    <ListItemText
                      primary="Inactive Ballots"
                      primaryTypographyProps={{ noWrap: true }}
                      secondary={
                        <React.Fragment>
                          <Typography component="span">
                            No candidate choices left
                          </Typography>
                          {lostVotes + ' votes'}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ) : null}
              </List>
            </Grid>
            <Grid item className={classes.bars}>
              <div className={classes.chartHeader}>
                {/*<Chip
                  className={classes.chartLabel}
                  label={`${Math.round(
                    victoryPercentage * 100
                  )}% (${votesToWin} votes)`}
                  style={{ marginLeft: `${victoryPercentage * 10 * scalar}%` }}
                />*/}

                <Typography
                  variant="span"
                  className={classes.chartLabel}
                  style={{ display: 'inline-block' }}
                >
                  {`${Math.round(
                    victoryPercentage * 100
                  )}% (${votesToWin.toFixed(2)} votes)`}
                </Typography>
              </div>
              <div
                style={{
                  width: '100%',
                  // prettier-ignore
                  backgroundImage: graphRulesGradient + ', ' + finishLIne,
                  // prettier-ignore
                  backgroundPosition: `left, ${victoryPercentage * 10 * scalar + 0.5}%`,
                  // prettier-ignore
                  backgroundRepeat: 'no-repeat, no-repeat',
                  backgroundSize: 'contain, 0.5% 100%',
                  border: '2px solid #000'
                }}
                // elevation={8}
              >
                {sortedCandidates.map(candidate => {
                  const segments = thisRound.segments[candidate.id];
                  const total = thisRound.totals[candidate.id];
                  return (
                    <Candidate
                      key={candidate.id}
                      graphWidthInVotes={graphWidthInVotes}
                      voteSegments={segments}
                      totalVotesForCandidate={total}
                      percentageOfWin={(total / votesToWin) * 100}
                      candidate={candidate}
                      colorMap={colorMap || {}}
                      winner={results.winners.includes(candidate.id)}
                      loser={thisRound.previousLosers.includes(candidate.id)}
                    />
                  );
                })}
              </div>
              <div className={classes.belowGraph}>
                <div className={classes.electionNotices}>
                  {this.renderElectionNotice(
                    allWinners,
                    numberOfWinners,
                    roundInt,
                    totalRounds,
                    candidates,
                    results
                  )}
                </div>
                <div className={classes.buttonGroup}>
                  <Button
                    disabled={roundInt === 1}
                    variant="raised"
                    color="secondary"
                    component={Link}
                    to={`/monitor/${key}/round/${roundInt - 1} `}
                    className={[classes.button, classes.buttonNarrow]}
                    fullWidth
                  >
                    Last Round
                  </Button>
                  <Button
                    disabled={allWinners.length >= numberOfWinners}
                    variant="raised"
                    color="secondary"
                    component={Link}
                    to={`/monitor/${key}/round/${nextRound}`}
                    className={[classes.button, classes.buttonNarrow]}
                    fullWidth
                  >
                    Next Round
                  </Button>
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(Monitor);
