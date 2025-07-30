#!/bin/bash
cd /home/kavia/workspace/code-generation/interactive-tic-tac-toe-platform-7857-7901/tic_tac_toe_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

