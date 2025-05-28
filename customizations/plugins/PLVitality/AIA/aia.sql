CREATE DATABASE IF NOT EXISTS aia;

USE aia;

DROP TABLE IF EXISTS `transactions`;

CREATE TABLE `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `document_sid` VARCHAR(255) DEFAULT NULL,
  `document_item_sid` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(10) DEFAULT NULL,
  `numOfUsage` INT DEFAULT NULL,
  `status` INT DEFAULT NULL,
  `currency` VARCHAR(50) DEFAULT NULL,
  `fullFareAmount` VARCHAR(50) DEFAULT NULL,
  `qualifyingAmount` VARCHAR(50) DEFAULT NULL,
  `discountedAmount` VARCHAR(50) DEFAULT NULL,
  `additionalFees` VARCHAR(50) DEFAULT NULL,
  `cancellationFees` VARCHAR(50) DEFAULT NULL,
  `discountAmount` VARCHAR(50) DEFAULT NULL,
  `discountPercentage` VARCHAR(50) DEFAULT NULL,
  `amountEffectiveDate` DATE DEFAULT NULL,
  `lineReference` VARCHAR(255) DEFAULT NULL,
  `lineDescription` VARCHAR(50) DEFAULT NULL,
  `qualifyingTransaction` TINYINT(1) DEFAULT NULL,
  `partnerSubCode` VARCHAR(50) DEFAULT NULL,
  `sku` VARCHAR(255) DEFAULT NULL,
  `uniqueProductRef` VARCHAR(255) DEFAULT NULL,
  `productCategory` VARCHAR(50) DEFAULT NULL,
  `transactionDate` DATE DEFAULT NULL,
  `memberfullName` VARCHAR(255) DEFAULT NULL,
  `memberIdentifierReference` VARCHAR(255) DEFAULT NULL,
  `memberIdentifierReferenceType` VARCHAR(50) DEFAULT NULL,
  `partnerTransactionRef` VARCHAR(50) DEFAULT NULL,
  `remarks` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
