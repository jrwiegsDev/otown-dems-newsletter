import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
} from '@chakra-ui/react';
import api from '../api/axiosConfig';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
      record.issueCounts.forEach((count, issue) => {
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
        data: analyticsData.map(record => record.issueCounts.get(issue) || 0).reverse(),
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
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

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
    <VStack spacing={6} align="stretch" w="100%">
      {/* Current Week Stats */}
      <Box>
        <Heading size="lg" mb={4}>Current Week ({currentWeekStats?.weekIdentifier})</Heading>
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4} mb={4}>
          <GridItem>
            <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={5}>
              <Stat>
                <StatLabel>Total Votes</StatLabel>
                <StatNumber color="blue.500">{currentWeekStats?.totalVotes || 0}</StatNumber>
              </Stat>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={5}>
              <Stat>
                <StatLabel>Top Issue</StatLabel>
                <StatNumber fontSize="xl" color="blue.500">
                  {currentWeekStats?.results?.[0]?.issue || 'N/A'}
                </StatNumber>
                <StatHelpText>
                  {currentWeekStats?.results?.[0]?.percentage?.toFixed(1) || 0}% of votes
                </StatHelpText>
              </Stat>
            </Box>
          </GridItem>
        </Grid>

        {/* Current Week Results Table */}
        {currentWeekStats?.results && (
          <Box mb={4}>
            <Heading size="md" mb={3}>Issue Breakdown</Heading>
            <TableContainer bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Issue</Th>
                    <Th>Votes</Th>
                    <Th>Percentage</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {currentWeekStats.results.map((result) => (
                    <Tr key={result.issue}>
                      <Td>{result.issue}</Td>
                      <Td>{result.count}</Td>
                      <Td>{result.percentage.toFixed(1)}%</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
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

      {/* Historical Trends Charts */}
      <Box>
        <Heading size="lg" mb={4}>Historical Trends (Last 52 Weeks)</Heading>
        
        {chartData && (
          <VStack spacing={6}>
            <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={5} w="100%">
              <Heading size="md" mb={4}>Total Votes Over Time</Heading>
              <Box h="300px">
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

            <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="md" p={5} w="100%">
              <Heading size="md" mb={4}>Top 5 Issues Over Time</Heading>
              <Box h="300px">
                <Line 
                  data={chartData.issuesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
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
          </VStack>
        )}
      </Box>

      {/* Weekly Results Table */}
      <Box>
        <Heading size="lg" mb={4}>Weekly Results Archive</Heading>
        <TableContainer 
          bg={bgColor} 
          border="1px" 
          borderColor={borderColor} 
          borderRadius="md" 
          maxH="600px" 
          overflowY="auto"
        >
          <Table variant="simple">
            <Thead position="sticky" top={0} bg={useColorModeValue('blue.500', 'blue.700')} zIndex={1}>
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
                record.issueCounts.forEach((count, issue) => {
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
                Current week: <strong>{currentWeekStats?.weekIdentifier}</strong><br />
                Total votes: <strong>{currentWeekStats?.totalVotes || 0}</strong>
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
    </VStack>
  );
};

export default AnalyticsDashboard;
