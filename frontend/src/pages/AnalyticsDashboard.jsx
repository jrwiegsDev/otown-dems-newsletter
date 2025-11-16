import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  VStack,
  HStack,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
} from '@chakra-ui/react';
import api from '../api/axiosConfig';
import VolunteerManagement from '../components/VolunteerManagement';
import PollIssueManager from '../components/PollIssueManager';
import useVolunteers from '../hooks/useVolunteers';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [currentWeekStats, setCurrentWeekStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Use volunteers hook
  const {
    volunteers,
    isLoadingVolunteers,
    searchTerm: volunteerSearchTerm,
    setSearchTerm: setVolunteerSearchTerm,
    filteredVolunteers,
    fetchVolunteers,
    deleteVolunteer,
    updateVolunteer,
  } = useVolunteers(user);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('Analytics WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'pollResults') {
              setCurrentWeekStats(data);
              
              // If poll was reset, reload analytics data
              if (data.reset) {
                fetchAnalyticsData();
              }
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('Analytics WebSocket disconnected');
          // Attempt reconnection after 5 seconds (don't reload the page)
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 5000);
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        // Retry connection after 5 seconds
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Fetch current week results
  const fetchCurrentWeekResults = async () => {
    try {
      const response = await api.get('/api/poll/results');
      console.log('Current week stats:', response.data);
      setCurrentWeekStats(response.data);
    } catch (err) {
      console.error('Error fetching current week results:', err);
    }
  };

  // Fetch historical analytics data
  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get('/api/poll/analytics', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setAnalyticsData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching analytics');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCurrentWeekResults();
    fetchAnalyticsData();
  }, []);

  // Debug logging for currentWeekStats
  useEffect(() => {
    if (currentWeekStats) {
      console.log('currentWeekStats updated:', currentWeekStats);
      console.log('All keys:', Object.keys(currentWeekStats));
      console.log('Total votes:', currentWeekStats.totalVotes);
      console.log('Issue counts:', currentWeekStats.issueCounts);
    }
  }, [currentWeekStats]);

  // Transform currentWeekStats to include results array for easier display
  const transformedWeekStats = currentWeekStats ? {
    ...currentWeekStats,
    results: Object.entries(currentWeekStats.issueCounts || {})
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: currentWeekStats.totalVotes > 0 
          ? (count / currentWeekStats.totalVotes) * 100 
          : 0
      }))
      .filter(item => item.count > 0) // Only show issues with votes
      .sort((a, b) => b.count - a.count) // Sort by count descending
  } : null;

  // Handle emergency reset
  const handleResetWeek = async () => {
    setResetting(true);
    try {
      const response = await api.post('/api/poll/reset-week', {}, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      alert(`Poll reset successfully!\nVotes deleted: ${response.data.votesDeleted}\nArchived: ${response.data.archived ? 'Yes' : 'No'}`);
      setShowResetModal(false);
      
      // Refresh data
      await fetchCurrentWeekResults();
      await fetchAnalyticsData();
    } catch (err) {
      alert('Error resetting poll: ' + (err.response?.data?.message || err.message));
    } finally {
      setResetting(false);
    }
  };

  // Handle CSV export
  const handleExportCSV = async () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const response = await api.get(`/api/poll/monthly-export/${year}/${month}`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `poll-data-${year}-${month}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error exporting CSV: ' + (err.response?.data?.message || err.message));
    }
  };

  // Prepare chart data for trends
  const prepareChartData = () => {
    if (analyticsData.length === 0) return null;

    const labels = analyticsData.map(record => record.weekIdentifier).reverse();
    const totalVotes = analyticsData.map(record => record.totalVotes).reverse();

    // Get top 5 issues by total count
    const issueTotals = {};
    analyticsData.forEach(record => {
      Object.entries(record.issueCounts || {}).forEach(([issue, count]) => {
        issueTotals[issue] = (issueTotals[issue] || 0) + count;
      });
    });

    const topIssues = Object.entries(issueTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);

    const issueDatasets = topIssues.map((issue, index) => {
      const colors = [
        '#3b82f6', // blue
        '#ef4444', // red
        '#10b981', // green
        '#f59e0b', // amber
        '#8b5cf6'  // purple
      ];

      return {
        label: issue,
        data: analyticsData.map(record => record.issueCounts?.[issue] || 0).reverse(),
        borderColor: colors[index],
        backgroundColor: colors[index] + '33',
        tension: 0.3
      };
    });

    return {
      totalVotesData: {
        labels,
        datasets: [{
          label: 'Total Votes',
          data: totalVotes,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f633',
          tension: 0.3
        }]
      },
      issuesData: {
        labels,
        datasets: issueDatasets
      }
    };
  };

  const chartData = prepareChartData();
  
  // Prepare volunteer analytics data
  const prepareVolunteerAnalytics = () => {
    if (!volunteers || volunteers.length === 0) return null;

    const VOLUNTEER_PROGRAMS = [
      'Adopt A Highway',
      'Christmas Toy Drive',
      'Thanksgiving Meal Drive',
      'Food Pantry Support',
      'Community Garden',
      'Literacy Tutoring',
      'Senior Outreach',
      'Voter Registration',
      'School Supply Drive',
      'Winter Coat Drive',
      'Book Drive',
      'Community Clean-Up Events'
    ];

    // Count volunteers per program
    const programCounts = {};
    VOLUNTEER_PROGRAMS.forEach(program => {
      programCounts[program] = 0;
    });

    volunteers.forEach(volunteer => {
      if (volunteer.interestedPrograms && Array.isArray(volunteer.interestedPrograms)) {
        volunteer.interestedPrograms.forEach(program => {
          if (programCounts.hasOwnProperty(program)) {
            programCounts[program]++;
          }
        });
      }
    });

    // Sort by count descending
    const sortedPrograms = Object.entries(programCounts)
      .sort((a, b) => b[1] - a[1]);

    const labels = sortedPrograms.map(([program]) => program);
    const data = sortedPrograms.map(([, count]) => count);

    return {
      labels,
      datasets: [{
        label: 'Volunteers Interested',
        data,
        backgroundColor: [
          '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
          '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
          '#14b8a6', '#a855f7'
        ],
        borderColor: '#1e293b',
        borderWidth: 1
      }]
    };
  };

  const volunteerAnalytics = prepareVolunteerAnalytics();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const tableHeaderBg = useColorModeValue('blue.500', 'blue.700');

  if (loading) {
    return (
      <Box p={5}>
        <Text>Loading analytics...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={5}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box w="100%">
      <Tabs colorScheme="blue" size="lg" variant="enclosed">
        <TabList mb={4} flexWrap="wrap">
          <Tab fontWeight="semibold" fontSize="lg">📊 Poll Analytics</Tab>
          <Tab fontWeight="semibold" fontSize="lg">⚙️ Manage Issues</Tab>
          <Tab fontWeight="semibold" fontSize="lg">🙋 Volunteers</Tab>
        </TabList>

        <TabPanels>
          {/* Poll Analytics Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch" w="100%">
              {/* Live Current Week Analytics */}
              <Box>
                <Heading size="lg" mb={4}>📊 Live Results - Current Week ({transformedWeekStats?.weekIdentifier})</Heading>
                
                {/* Summary Stats Grid */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={6}>
                  <Box bg={useColorModeValue('blue.50', 'blue.900')} p={5} borderRadius="md">
                    <Stat>
                      <StatLabel fontSize="sm">Total Votes This Week</StatLabel>
                      <StatNumber fontSize="3xl" color="blue.500">
                        {transformedWeekStats?.totalVotes || 0}
                      </StatNumber>
                      <StatHelpText>Live count</StatHelpText>
                    </Stat>
                  </Box>
                  
                  <Box bg={useColorModeValue('green.50', 'green.900')} p={5} borderRadius="md">
                    <Stat>
                      <StatLabel fontSize="sm">Top Issue</StatLabel>
                      <StatNumber fontSize="xl" color="green.500" noOfLines={1}>
                        {transformedWeekStats?.results?.[0]?.issue || 'N/A'}
                      </StatNumber>
                      <StatHelpText>
                        {transformedWeekStats?.results?.[0]?.percentage?.toFixed(1) || 0}% of votes
                      </StatHelpText>
                    </Stat>
                  </Box>

                  <Box bg={useColorModeValue('purple.50', 'purple.900')} p={5} borderRadius="md">
                    <Stat>
                      <StatLabel fontSize="sm">Total Issues Voted On</StatLabel>
                      <StatNumber fontSize="3xl" color="purple.500">
                        {transformedWeekStats?.results?.length || 0}
                      </StatNumber>
                      <StatHelpText>Unique concerns</StatHelpText>
                    </Stat>
                  </Box>
                </Grid>

                {/* Live Results - Compact Grid Layout */}
                {transformedWeekStats?.results && transformedWeekStats.results.length > 0 && (
                  <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mb={4}>
                    {/* Chart */}
                    <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={5}>
                      <Heading size="md" mb={4}>Current Week Distribution</Heading>
                      <Box h="300px">
                        <Bar 
                          data={{
                            labels: transformedWeekStats.results.map(r => r.issue),
                            datasets: [{
                              label: 'Votes',
                              data: transformedWeekStats.results.map(r => r.count),
                              backgroundColor: [
                                '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                                '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
                              ],
                              borderColor: '#1e293b',
                              borderWidth: 1
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const percentage = transformedWeekStats.results[context.dataIndex].percentage;
                                    return `${context.parsed.y} votes (${percentage.toFixed(1)}%)`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1,
                                  precision: 0
                                },
                                title: {
                                  display: true,
                                  text: 'Votes'
                                }
                              },
                              x: {
                                ticks: {
                                  font: {
                                    size: 10
                                  },
                                  maxRotation: 45,
                                  minRotation: 45
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Table */}
                    <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" maxH="400px" overflowY="auto">
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead bg={tableHeaderBg} position="sticky" top={0} zIndex={1}>
                            <Tr>
                              <Th color="white">#</Th>
                              <Th color="white">Issue</Th>
                              <Th color="white" isNumeric>Votes</Th>
                              <Th color="white" isNumeric>%</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {transformedWeekStats.results.map((result, index) => (
                              <Tr key={result.issue}>
                                <Td fontWeight="bold">{index + 1}</Td>
                                <Td fontSize="sm">{result.issue}</Td>
                                <Td isNumeric fontWeight="semibold">{result.count}</Td>
                                <Td isNumeric>
                                  <Badge colorScheme={index === 0 ? 'green' : index === 1 ? 'blue' : 'gray'} fontSize="xs">
                                    {result.percentage.toFixed(1)}%
                                  </Badge>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Grid>
                )}

                {transformedWeekStats?.totalVotes === 0 && (
                  <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={8} textAlign="center">
                    <Text color="gray.500" fontSize="lg">
                      No votes recorded yet this week. Live results will appear as users vote on the website.
                    </Text>
                  </Box>
                )}

                {/* Emergency Reset Button */}
                <Button
                  colorScheme="red"
                  size="lg"
                  width={{ base: "100%", md: "auto" }}
                  onClick={() => setShowResetModal(true)}
                >
                  🚨 Emergency Reset Current Week
                </Button>
              </Box>

              {/* Historical Trends Charts - Compact Grid */}
              <Box>
                <Heading size="lg" mb={2}>📈 Historical Trends</Heading>
                <Text color="gray.500" mb={4}>
                  Data from weekly resets (last 52 weeks). 
                  {analyticsData.length === 0 && ' Archive data will appear after the first weekly reset.'}
                </Text>
                
                {analyticsData.length > 0 ? (
                  <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                    <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={5}>
                      <Heading size="md" mb={4}>Total Votes Over Time</Heading>
                      <Box h="250px">
                        <Line 
                          data={chartData.totalVotesData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={5}>
                      <Heading size="md" mb={4}>Top 5 Issues Over Time</Heading>
                      <Box h="250px">
                        <Line 
                          data={chartData.issuesData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  font: {
                                    size: 10
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                ) : (
                  <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={8} textAlign="center">
                    <Text color="gray.500" fontSize="lg" mb={2}>
                      📊 No historical data yet
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      Historical trends will appear after your first weekly poll reset. 
                      Use the emergency reset button above to archive the current week's results.
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Weekly Results Archive Table */}
              <Box>
                <Heading size="lg" mb={2}>📋 Weekly Results Archive</Heading>
                <Text color="gray.500" mb={4}>
                  Historical data from completed weeks.
                  {analyticsData.length === 0 && ' Archive entries will appear after weekly resets.'}
                </Text>
                
                {analyticsData.length > 0 ? (
                  <TableContainer 
                    bg={bgColor} 
                    border="1px" 
                    borderColor={borderColor} 
                    borderRadius="md" 
                    maxH="600px" 
                    overflowY="auto"
                  >
                    <Table variant="simple">
                      <Thead position="sticky" top={0} bg={tableHeaderBg} zIndex={1}>
                        <Tr>
                          <Th color="white">Week</Th>
                          <Th color="white">Date Range</Th>
                          <Th color="white">Total Votes</Th>
                          <Th color="white">Top Issue</Th>
                          <Th color="white">Top Issue Count</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {analyticsData.map((record) => {
                          const weekEnding = new Date(record.weekEnding);
                          const weekStart = new Date(weekEnding);
                          weekStart.setDate(weekEnding.getDate() - 6);
                          
                          const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnding.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                          
                          // Find top issue
                          let topIssue = '';
                          let topCount = 0;
                          Object.entries(record.issueCounts || {}).forEach(([issue, count]) => {
                            if (count > topCount) {
                              topCount = count;
                              topIssue = issue;
                            }
                          });

                          return (
                            <Tr key={record.weekIdentifier}>
                              <Td>{record.weekIdentifier}</Td>
                              <Td>{dateRange}</Td>
                              <Td>{record.totalVotes}</Td>
                              <Td>{topIssue || 'N/A'}</Td>
                              <Td>{topCount}</Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={8} textAlign="center">
                    <Text color="gray.500" fontSize="lg">
                      No archived weeks yet. Past results will be stored here after weekly resets.
                    </Text>
                  </Box>
                )}
              </Box>

      {/* Monthly Export */}
      <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={5}>
        <Heading size="lg" mb={4}>Export Monthly Data</Heading>
        <HStack spacing={4} flexWrap="wrap">
          <Text fontWeight="semibold">Select Month:</Text>
          <Input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            maxW="200px"
          />
          <Button colorScheme="green" onClick={handleExportCSV}>
            📊 Download CSV
          </Button>
        </HStack>
              </Box>
            </VStack>
          </TabPanel>

          {/* Manage Poll Issues Tab */}
          <TabPanel px={0}>
            <PollIssueManager user={user} />
          </TabPanel>

          {/* Volunteer Management Tab */}
          <TabPanel px={0}>
            <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
              {/* Volunteer Analytics Tile */}
              <GridItem>
                <Box 
                  bg={bgColor} 
                  border="1px" 
                  borderColor={borderColor} 
                  borderRadius="md" 
                  p={5}
                  h="100%"
                >
                  <Heading size="lg" mb={4}>📊 Volunteer Analytics</Heading>
                  
                  {/* Summary Stats */}
                  <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={6}>
                    <Box bg={useColorModeValue('blue.50', 'blue.900')} p={4} borderRadius="md">
                      <Stat>
                        <StatLabel fontSize="sm">Total Volunteers</StatLabel>
                        <StatNumber fontSize="3xl" color="blue.500">
                          {volunteers?.length || 0}
                        </StatNumber>
                      </Stat>
                    </Box>
                    <Box bg={useColorModeValue('green.50', 'green.900')} p={4} borderRadius="md">
                      <Stat>
                        <StatLabel fontSize="sm">Avg Programs/Volunteer</StatLabel>
                        <StatNumber fontSize="3xl" color="green.500">
                          {volunteers?.length > 0 
                            ? (volunteers.reduce((sum, v) => sum + (v.interestedPrograms?.length || 0), 0) / volunteers.length).toFixed(1)
                            : 0
                          }
                        </StatNumber>
                      </Stat>
                    </Box>
                  </Grid>

                  {/* Program Interest Chart */}
                  {volunteerAnalytics && (
                    <Box>
                      <Heading size="md" mb={3}>Program Interest</Heading>
                      <Box h="400px">
                        <Bar 
                          data={volunteerAnalytics}
                          options={{
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `${context.parsed.x} volunteer${context.parsed.x !== 1 ? 's' : ''}`;
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1,
                                  precision: 0
                                },
                                title: {
                                  display: true,
                                  text: 'Number of Volunteers'
                                }
                              },
                              y: {
                                ticks: {
                                  font: {
                                    size: 11
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  )}

                  {volunteers?.length === 0 && (
                    <Text color="gray.500" textAlign="center" py={8}>
                      No volunteer data yet. Analytics will appear once volunteers sign up.
                    </Text>
                  )}
                </Box>
              </GridItem>

              {/* Volunteer Management Tile */}
              <GridItem>
                <Box 
                  bg={bgColor} 
                  border="1px" 
                  borderColor={borderColor} 
                  borderRadius="md" 
                  p={5}
                  h="100%"
                >
                  <VolunteerManagement
                    volunteers={volunteers}
                    isLoadingVolunteers={isLoadingVolunteers}
                    searchTerm={volunteerSearchTerm}
                    setSearchTerm={setVolunteerSearchTerm}
                    filteredVolunteers={filteredVolunteers}
                    fetchVolunteers={fetchVolunteers}
                    deleteVolunteer={deleteVolunteer}
                    updateVolunteer={updateVolunteer}
                  />
                </Box>
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>⚠️ Confirm Emergency Reset</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={3}>
              <Text>
                This will <strong>archive</strong> all current week votes to the analytics database
                and <strong>delete</strong> them from the active poll.
              </Text>
              <Text>
                Current week: <strong>{transformedWeekStats?.weekIdentifier}</strong><br />
                Total votes: <strong>{transformedWeekStats?.totalVotes || 0}</strong>
              </Text>
              <Text color="red.500" fontWeight="semibold">
                This action cannot be undone. Are you sure?
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button 
                colorScheme="red"
                onClick={handleResetWeek}
                isLoading={resetting}
                loadingText="Resetting..."
              >
                Yes, Reset Now
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setShowResetModal(false)}
                isDisabled={resetting}
              >
                Cancel
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AnalyticsDashboard;
