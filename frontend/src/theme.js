// Custom Chakra UI theme matching OADC site color scheme
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#2b3139' : '#e8eaed',
        color: props.colorMode === 'dark' ? '#e8eaed' : '#1c1e21',
      },
    }),
  },
  colors: {
    // Light mode greys
    light: {
      bg: '#e8eaed',
      surface: '#f5f6f7',
      text: '#1c1e21',
      textSecondary: '#5f6368',
      border: '#dadce0',
    },
    // Dark mode greys
    dark: {
      bg: '#2b3139',
      surface: '#353a42',
      text: '#e8eaed',
      textSecondary: '#9aa0a6',
      border: '#4a5058',
    },
  },
  components: {
    Box: {
      baseStyle: (props) => ({
        bg: props.colorMode === 'dark' ? 'dark.surface' : 'light.surface',
      }),
    },
    Modal: {
      baseStyle: (props) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? '#353a42' : '#f5f6f7',
        },
      }),
    },
    Table: {
      variants: {
        simple: (props) => ({
          th: {
            bg: props.colorMode === 'dark' ? '#353a42' : '#f5f6f7',
            color: props.colorMode === 'dark' ? '#e8eaed' : '#1c1e21',
            borderColor: props.colorMode === 'dark' ? '#4a5058' : '#dadce0',
          },
          td: {
            borderColor: props.colorMode === 'dark' ? '#4a5058' : '#dadce0',
          },
        }),
      },
    },
    Tabs: {
      variants: {
        enclosed: (props) => ({
          tab: {
            borderColor: props.colorMode === 'dark' ? '#4a5058' : '#dadce0',
            _selected: {
              bg: props.colorMode === 'dark' ? '#353a42' : '#f5f6f7',
              borderColor: props.colorMode === 'dark' ? '#4a5058' : '#dadce0',
              borderBottomColor: props.colorMode === 'dark' ? '#353a42' : '#f5f6f7',
            },
          },
          tabpanel: {
            bg: props.colorMode === 'dark' ? '#353a42' : '#f5f6f7',
            borderColor: props.colorMode === 'dark' ? '#4a5058' : '#dadce0',
          },
        }),
      },
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          bg: props.colorMode === 'dark' ? '#353a42' : '#f5f6f7',
          borderColor: props.colorMode === 'dark' ? '#4a5058' : '#dadce0',
        },
      }),
    },
  },
});

export default theme;
