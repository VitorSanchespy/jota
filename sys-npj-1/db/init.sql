-- Estrutura completa do banco npjdatabase
-- Gerado em 2025-07-18

-- Tabela: roles
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ativo` tinyint(1) DEFAULT '1',
  `telefone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=349 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: diligencia
DROP TABLE IF EXISTS `diligencia`;
CREATE TABLE `diligencia` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `diligencia_nome_unique` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: fase
DROP TABLE IF EXISTS `fase`;
CREATE TABLE `fase` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fase_nome_unique` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: materia_assunto
DROP TABLE IF EXISTS `materia_assunto`;
CREATE TABLE `materia_assunto` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `materia_assunto_nome_unique` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: local_tramitacao
DROP TABLE IF EXISTS `local_tramitacao`;
CREATE TABLE `local_tramitacao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: processos
DROP TABLE IF EXISTS `processos`;
CREATE TABLE `processos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_processo` varchar(50) NOT NULL,
  `descricao` text,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(30) DEFAULT NULL,
  `tipo_processo` varchar(50) DEFAULT NULL,
  `idusuario_responsavel` int DEFAULT NULL,
  `data_encerramento` timestamp NULL DEFAULT NULL,
  `observacoes` text,
  `sistema` enum('Físico','PEA','PJE') DEFAULT 'Físico',
  `materia_assunto_id` int unsigned DEFAULT NULL,
  `fase_id` int unsigned DEFAULT NULL,
  `diligencia_id` int unsigned DEFAULT NULL,
  `num_processo_sei` varchar(100) DEFAULT NULL,
  `assistido` varchar(100) DEFAULT NULL,
  `contato_assistido` varchar(255) DEFAULT NULL,
  `local_tramitacao_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_processo` (`numero_processo`),
  KEY `processos_idusuario_responsavel_foreign` (`idusuario_responsavel`),
  KEY `processos_materia_assunto_id_foreign` (`materia_assunto_id`),
  KEY `processos_fase_id_foreign` (`fase_id`),
  KEY `processos_diligencia_id_foreign` (`diligencia_id`),
  KEY `processos_local_tramitacao_id_foreign_idx` (`local_tramitacao_id`),
  CONSTRAINT `processos_diligencia_id_foreign` FOREIGN KEY (`diligencia_id`) REFERENCES `diligencia` (`id`),
  CONSTRAINT `processos_fase_id_foreign` FOREIGN KEY (`fase_id`) REFERENCES `fase` (`id`),
  CONSTRAINT `processos_idusuario_responsavel_foreign` FOREIGN KEY (`idusuario_responsavel`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `processos_local_tramitacao_id_foreign_idx` FOREIGN KEY (`local_tramitacao_id`) REFERENCES `local_tramitacao` (`id`) ON DELETE SET NULL,
  CONSTRAINT `processos_materia_assunto_id_foreign` FOREIGN KEY (`materia_assunto_id`) REFERENCES `materia_assunto` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: arquivos
DROP TABLE IF EXISTS `arquivos`;
CREATE TABLE `arquivos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `caminho` varchar(255) NOT NULL,
  `tamanho` int NOT NULL,
  `tipo` varchar(255) NOT NULL,
  `processo_id` int DEFAULT NULL,
  `usuario_id` int NOT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `arquivos_processo_id_foreign` (`processo_id`),
  KEY `arquivos_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `arquivos_processo_id_foreign` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`),
  CONSTRAINT `arquivos_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: atualizacoes_processo
DROP TABLE IF EXISTS `atualizacoes_processo`;
CREATE TABLE `atualizacoes_processo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `processo_id` int NOT NULL,
  `arquivos_id` int unsigned DEFAULT NULL,
  `data_atualizacao` datetime NOT NULL,
  `tipo_atualizacao` varchar(255) NOT NULL,
  `descricao` text,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `processo_id` (`processo_id`),
  KEY `arquivos_id` (`arquivos_id`),
  CONSTRAINT `atualizacoes_processo_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `atualizacoes_processo_ibfk_2` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `atualizacoes_processo_ibfk_3` FOREIGN KEY (`arquivos_id`) REFERENCES `arquivos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: usuarios_processo
DROP TABLE IF EXISTS `usuarios_processo`;
CREATE TABLE `usuarios_processo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `processo_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_processo_usuario_id_processo_id` (`usuario_id`,`processo_id`),
  KEY `processo_id` (`processo_id`),
  CONSTRAINT `usuarios_processo_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `usuarios_processo_ibfk_2` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela: sequelizemeta
DROP TABLE IF EXISTS `sequelizemeta`;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
