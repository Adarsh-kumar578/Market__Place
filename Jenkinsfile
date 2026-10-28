
pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
                echo 'Source code checked out successfully.'
            }
        }

        stage('Check Node.js') {
            steps {
                bat 'node --version'
                bat 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Validate Application') {
            steps {
                bat 'node --check server.js'
                echo 'JavaScript validation passed.'
            }
        }
    }

    post {
        success {
            echo 'Marketplace pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
    }
}
