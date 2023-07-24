# Bate-Papo UOL API <img src="https://conteudo.imguol.com.br/c/home/layout/vueland/icons/brand/uol-logo-full.svg?v5" width=80px>
A chat room API

# About
This API allows users to send public or private messages on a chat room.

# EndPoints
## Users

|  HTTP Method | Route  | Description  |
|---|---|---|
| POST  | /participants  | Enter the room  |
| GET  | /participants  | Get list of Participants  |
| POST  | /status  | Keep user logged in  |

## Transactions
|  HTTP Method | Route  | Description  |
|---|---|---|
| POST  | /messages | Send a message |
| GET  | /messages  | See all public messages and private messages related to the logged user  |
| DELETE  | /messages/:id  | Delete the message with the given id  |
| PUT  | /messages/:id  | Edit the message with the given id  |

# Technologies
  ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
	![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
 	![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
  ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)

# Related Projects
This is a Full Stack project. You can check the Front End repository <a href="https://github.com/renatainacio/Bate-Papo-UOL"> here</a>.
