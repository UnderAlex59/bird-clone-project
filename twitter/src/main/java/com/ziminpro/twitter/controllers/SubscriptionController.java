package com.ziminpro.twitter.controllers;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.ziminpro.twitter.dtos.Constants;
import com.ziminpro.twitter.dtos.Subscription;
import com.ziminpro.twitter.services.SubscriptionsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

@RestController
public class SubscriptionController {

    @Autowired
    private SubscriptionsService subscriptionsService;

    Map<String, Object> response = new HashMap<>();

    @RequestMapping(method = RequestMethod.GET, path = Constants.URI_SUBSCRIPTION + "/{subscriber-id}")
    public Mono<ResponseEntity<Map<String, Object>>> getSubscriptionBySubscriberId(
            @PathVariable(value = "subscriber-id", required = true) UUID subscriberId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        return subscriptionsService.getSubscriptionsForSubscriberById(subscriberId, authorizationHeader);
    }

    @RequestMapping(method = RequestMethod.GET, path = Constants.URI_PRODUCER_SUBSCRIBERS + "/{producer-id}")
    public Mono<ResponseEntity<Map<String, Object>>> getSubscribersByProducerId(
            @PathVariable(value = "producer-id", required = true) UUID producerId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        return subscriptionsService.getSubscribersForProducerById(producerId, authorizationHeader);
    }

    @RequestMapping(method = RequestMethod.PUT, path = Constants.URI_SUBSCRIPTIONS, consumes = Constants.APPLICATION_JSON)
    public Mono<ResponseEntity<Map<String, Object>>> up(@RequestBody Subscription subscription,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        return subscriptionsService.updateSubscriptionForSubscriberById(subscription, authorizationHeader);
    }

    @RequestMapping(method = RequestMethod.POST, path = Constants.URI_SUBSCRIPTIONS, consumes = Constants.APPLICATION_JSON)
    public Mono<ResponseEntity<Map<String, Object>>> createSubscription(@RequestBody Subscription subscription,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        return subscriptionsService.createSubscription(subscription, authorizationHeader);
    }

    @RequestMapping(method = RequestMethod.DELETE, path = Constants.URI_SUBSCRIPTION + "/{subscriber-id}")
    public Mono<ResponseEntity<Map<String, Object>>> createSubscription(
            @PathVariable(value = "subscriber-id", required = true) UUID subscriberId,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        return subscriptionsService.deleteSubscriptionForSubscriberById(subscriberId, authorizationHeader);
    }
}
