package com.ziminpro.twitter.dao;

import java.util.UUID;

import com.ziminpro.twitter.dtos.ProducerSubscribers;
import com.ziminpro.twitter.dtos.Subscription;

public interface SubscriptionRepository {
    public Subscription getSubscription(UUID subscriberId);
    public ProducerSubscribers getSubscribers(UUID producerId);
    public boolean createSubscription(Subscription subscription);
    public boolean updateSubscription(Subscription subscription);
    public boolean deleteSubscription(UUID subscriberId);
}
