import { Box, Button, Center, Flex, Heading, Image, Input, SimpleGrid, Text } from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState} from 'react';
import { ethers } from 'ethers';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isMessageSigned, setIsMessageSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  async function connectToMetamask() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const message = 'I am signing this message to connect.';
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = provider.getSigner(accounts[0]); 
          const signature = await signer.signMessage(message);
          const address = await signer.getAddress();
          setUserAddress(address);
          setIsMessageSigned(true);
        } 
      } catch (error) {
        setError(error);
        console.error('Error connecting to Metamask:', error);
      }
    } else {
      setError('Metamask extension not found. Please install Metamask and try again.');
      console.error('Metamask extension not found.');
    }
  }
  function disconnectMetamask() {
    if (window.ethereum) {
      window.ethereum = null;
      setUserAddress('');
      setIsMessageSigned(false);
    }
  }

  function resetBalance() {
    setUserAddress('');
    setError(null);
    setIsMessageSigned(false); 
    setIsLoading(false)
    setTokenDataObjects([])
    setHasQueried(false)
}


function isENSName(inputStr) {
  const ensPattern = /^[a-zA-Z0-9-\.]+$/;
  return ensPattern.test(inputStr);
}

  async function getTokenBalance() {
    const config = {
      apiKey: "",
      network: Network.ETH_MAINNET,
    };
    try{
      const alchemy = new Alchemy(config);
      setIsLoading(true); 
      let data;
      if(isENSName(userAddress)){
        const address = await  alchemy.core.resolveName(userAddress);
        data = await alchemy.core.getTokenBalances(address);
        setResults(data);
        // const address = await alchemy.core.resolveName(userAddress);
      }
      else{
        data = await alchemy.core.getTokenBalances(userAddress);
        setResults(data);
      }
      
  
      const tokenDataPromises = [];
  
      for (let i = 0; i < data.tokenBalances.length; i++) {
        const tokenData = alchemy.core.getTokenMetadata(
          data.tokenBalances[i].contractAddress
        );
        tokenDataPromises.push(tokenData);
      }
  
      setTokenDataObjects(await Promise.all(tokenDataPromises));
      setHasQueried(true);
      setIsLoading(false);
    }catch(error){
      setError(error);
    } 

    
  }
  return (
    <Box w="100vw" p={8}>
      <Center>
        <Flex
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Heading as="h1" size="xl" mb={0} mt={10}>
            ERC-20 Token Indexer
          </Heading>
          <Text fontSize="lg" textAlign="center" mb={4}>
            Get all the ERC-20 token balances of any Ethereum address or ENS name! 
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        mt={4}
        boxShadow="lg"
        p={8}
        borderRadius="md"
        bgColor="white"
      >
        <Heading as="h2" size="md" mb={18}>
          Connect your Metamask address or manually input one:
        </Heading>
        <Input
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="400px"
          textAlign="center"
          p={10}
          bgColor="white"
          fontSize="xl"
        />

        {!isMessageSigned ? (
          <Button
            size="lg"
            onClick={connectToMetamask}
            mt={18}
            bgColor="black"
            color="white"
            _hover={{ bgColor: 'black.600' }}
          >
            Connect Metamask
          </Button>
        ) : userAddress && (
          <Button
            size="lg"
            onClick={disconnectMetamask}
            mt={18}
            bgColor="black"
            color="white"
            _hover={{ bgColor: 'black.600' }}
          >
            Disconnect Metamask
          </Button>
        )}

        {!isLoading ? (
          <Button
            size="lg"
            onClick={getTokenBalance}
            mt={18}
            bgColor="black"
            color="white"
            _hover={{ bgColor: 'black.600' }}
            disabled={!userAddress}
          >
            Check ERC-20 Token Balances
          </Button>
        ) : error ? (
          <Heading as="h3" size="md" mt={18} color="red">
            Some Error Occurred
          </Heading>
        ) : (
          <Heading as="h3" size="md" mt={18} color="green">
            Checking
          </Heading>
        )}

        <Button
          size="lg"
          onClick={resetBalance}
          mt={18}
          bgColor="black"
          color="white"
          _hover={{ bgColor: 'black.600' }}
        >
          Reset Balances
        </Button>

       {hasQueried ? (   <Heading as="h2" size="lg" my={18}>
          ERC-20 token balances:
        </Heading>) : null}

        {hasQueried &&  results.tokenBalances && !isLoading? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
  {results.tokenBalances.map((e, i) => {
    return (
      <Flex
        flexDir={'column'}
        color="white"
        // bg="blue"
        w={'20vw'}
        key={e.id}
        justifyContent="center" alignItems="center"
        h="200px"
        bg="black"
       borderRadius="8px" // border-radius: 8px;
       boxShadow="0 4px 8px rgba(0, 0, 0, 0.1);" 
      >
        <Box>
          <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
        </Box>
        <Text isTruncated={true}>
          <b>Balance:</b>&nbsp;
          {Utils.formatUnits(
            e.tokenBalance,
            tokenDataObjects[i].decimals
          )}
        </Text>
        <Image src={tokenDataObjects[i].logo} />
      </Flex>
    );
  })}
</SimpleGrid>
        ) : (
          <Heading as="h2" size="lg" my={18}>while making query it may take a few seconds...</Heading>
        )}
      </Flex>
    </Box>
  );
}

export default App;
