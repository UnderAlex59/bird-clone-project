package com.ziminpro.twitter.dtos;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProducerSubscribers {
    private UUID producer;
    private List<UUID> subscribers = new ArrayList<>();

    public void addSubscriber(UUID subscriberId) {
        this.subscribers.add(subscriberId);
    }
}
