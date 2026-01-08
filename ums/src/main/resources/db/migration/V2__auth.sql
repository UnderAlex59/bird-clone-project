CREATE TABLE `user_identities` (
  `id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `provider` varchar(32) NOT NULL,
  `provider_user_id` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_identities_provider` (`provider`, `provider_user_id`),
  KEY `fk_user_identities_users_idx` (`user_id`),
  CONSTRAINT `fk_user_identities_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
