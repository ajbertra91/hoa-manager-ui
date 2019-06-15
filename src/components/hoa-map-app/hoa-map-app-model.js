import { ApolloClient, ApolloLink } from 'apollo-boost';
import { onError } from 'apollo-link-error';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';
import omitDeep from 'omit-deep-lodash';

const hostname = window.location.hostname;
let URI = '';
if (hostname === 'localhost') {
    URI = 'http://localhost:4000'
} else {
    URI = 'https://ajb-hoa-manager-services.herokuapp.com'
}

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

    const client = new ApolloClient({
        link: createHttpLink({ uri: `${URI}/graphql` }),
        cache: new InMemoryCache()
    });

    return client.query({
        query: MY_QUERY,
        variables: {lot},
        fetchOptions: { mode: 'cors' }
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

    const client = new ApolloClient({
        link: createHttpLink({ uri: `${URI}/graphql` }),
        cache: new InMemoryCache()
    });

    return client.query({
        query: MY_QUERY,
        variables: { number },
        fetchOptions: { mode: 'cors' }
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

    const client = new ApolloClient({
        link: ApolloLink.from([ errorLink, createHttpLink({ uri: `${URI}/graphql` }) ]),
        cache: new InMemoryCache()
    });

    return client
        .mutate({
            mutation: MY_MUTATION,
            variables: { houseInput: omitDeep(houseInput, '__typename') },
            fetchOptions: { mode: 'cors' }
        })
        .then(response => response);
}






