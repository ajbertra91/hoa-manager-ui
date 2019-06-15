import { ApolloClient, ApolloLink } from 'apollo-boost';
import { onError } from 'apollo-link-error';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';
import omitDeep from 'omit-deep-lodash';

export function getHouseById(lot) {
    console.log('lot: ', lot)
    const MY_QUERY = gql`
        query getHouseById($lot: ID!) {
            house(lot: $lot) {
                _id
                lot
                address
                contactInfo {
                    mobile
                    phone
                    email
                }
                owners {
                    firstName
                    lastName
                }
                hoaFeePaid {
                    year
                    paid
                    lateFee
                    value
                }
                violations {
                    type
                    noticeSent
                    value
                    paid
                }
                requests {
                    type
                    approved
                }
            }
        }
    `;

    const hostname = window.location.hostname;
    let uri = '';
    if (hostname === 'localhost') {
        uri = 'http://localhost:4000'
    } else {
        uri = 'https://ajb-hoa-manager-services.herokuapp.com'
    }
    const client = new ApolloClient({
        link: createHttpLink({uri: `${uri}/graphql`}),
        cache: new InMemoryCache()
    });

    return client.query({
        query: MY_QUERY,
        variables: {lot},
        context: {
            headers: {
                special: "Special header value"
            }
        }
    })
    .then(response => response);
}

export function getHouseByAddress(number) {
    const MY_QUERY = gql`
        query getHouseByAddress($number: String!) {
            address(number: $number) {
                _id
                lot
                address
                contactInfo {
                    mobile
                    phone
                    email
                }
                owners {
                    firstName
                    lastName
                }
                hoaFeePaid {
                    year
                    paid
                    lateFee
                    value
                }
                violations {
                    type
                    noticeSent
                    value
                    paid
                }
                requests {
                    type
                    approved
                }
            }
        }
    `;

    const hostname = window.location.hostname;
    let uri = '';
    if (hostname === 'localhost') {
        uri = 'http://localhost:4000'
    } else {
        uri = 'https://ajb-trivia-game-services.herokuapp.com'
    }
    const client = new ApolloClient({
        link: createHttpLink({ uri: `${uri}/graphql` }),
        cache: new InMemoryCache()
    });

    return client.query({
        query: MY_QUERY,
        variables: { number },
        context: {
            headers: {
                special: "Special header value"
            }
        }
    })
    .then(response => response);
}

export function updateHouse(houseInput) {
    const errorLink = onError(({ graphQLErrors }) => {
        if (graphQLErrors) graphQLErrors.map(({ message }) => console.log(message))
    })
    const MY_MUTATION = gql`
        mutation UpdateHouse($houseInput: HouseInput!) {
            updateHouse(houseInput: $houseInput) {
                _id
                lot
                address
                contactInfo {
                    mobile
                    email
                    phone
                }
                owners {
                    firstName
                    lastName
                }
                hoaFeePaid {
                    year
                    paid
                    value
                    lateFee
                }
                requests {
                    type
                    approved
                }
                violations {
                    type
                    noticeSent
                    value
                    paid
                }
            }
        }
    `;

    const hostname = window.location.hostname;
    let uri = '';
    if (hostname === 'localhost') {
        uri = 'http://localhost:4000'
    } else {
        uri = 'https://ajb-trivia-game-services.herokuapp.com'
    }
    const client = new ApolloClient({
        // link: createHttpLink({ uri: `${uri}/graphql` }),
        link: ApolloLink.from([errorLink, createHttpLink({ uri: `${uri}/graphql` })]),
        cache: new InMemoryCache()
    });

    return client
        .mutate({
            mutation: MY_MUTATION,
            variables: { houseInput: omitDeep(houseInput, '__typename') }
        })
        .then(response => response);
}






