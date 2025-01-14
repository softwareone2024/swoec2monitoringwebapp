import json
import boto3
import os

def lambda_handler(event, context):
    ec2 = boto3.client('ec2')
    iam = boto3.client('iam')
    s3 = boto3.client('s3')
    ssm = boto3.client('ssm')

    # Account ID and region
    account_id = context.invoked_function_arn.split(":")[4]
    region = os.environ.get("AWS_REGION")

    # Account name from environment variable
    account_name = os.environ.get("ACCOUNT_NAME", "Unknown Account")

    # Retrieve instance information
    instances = ec2.describe_instances()
    instance_info = []
    for reservation in instances['Reservations']:
        for instance in reservation['Instances']:
            # Collect basic information
            instance_id = instance['InstanceId']
            instance_type = instance['InstanceType']
            instance_state = instance['State']['Name']
            
            # Get instance name from tags
            instance_name = next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'Name'), "N/A")
            
            # Get swoMonitor, swoBackup, swoPatch tags and check Start-Stop
            swo_monitor = next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'swoMonitor'), "N/A")
            swo_backup = next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'swoBackup'), "N/A")
            swo_patch = next((tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'swoPatch'), "N/A")
            start_stop = "Enabled" if any(tag['Key'] in ['Start', 'Shutdown'] for tag in instance.get('Tags', [])) else "Disabled"

            # Get platform details
            platform_details = instance.get('PlatformDetails', 'Platform Details Not Available')

            # Get associated role
            iam_instance_profile = instance.get('IamInstanceProfile')
            instance_role = iam_instance_profile['Arn'].split('/')[-1] if iam_instance_profile else "No Role"
            
            # Get SSM status and compliance counts
            ssm_status = "Not Available"
            critical_non_compliant_count = 0
            security_non_compliant_count = 0
            try:
                # Get SSM connection status
                ssm_instance_info = ssm.describe_instance_information(
                    Filters=[{'Key': 'InstanceIds', 'Values': [instance_id]}]
                )['InstanceInformationList']
                ssm_status = ssm_instance_info[0]['PingStatus'] if ssm_instance_info else "Not Available"

                # Get patch states
                patch_state = ssm.describe_instance_patch_states(
                    InstanceIds=[instance_id]
                )['InstancePatchStates']

                if patch_state:
                    for patch in patch_state:
                        critical_non_compliant_count = patch.get('CriticalNonCompliantCount', 0)
                        security_non_compliant_count = patch.get('SecurityNonCompliantCount', 0)

            except Exception as e:
                print(f"Error retrieving compliance for instance {instance_id}: {str(e)}")

            # Add collected data to the list
            instance_info.append({
                'InstanceId': instance_id,
                'InstanceName': instance_name,
                'InstanceType': instance_type,
                'State': instance_state,
                'Account': account_name,
                'AccountId': account_id,  # Added AccountId here
                'Region': region,
                'PlatformDetails': platform_details,
                'Role': instance_role,
                'SSMStatus': ssm_status,
                'CriticalNonCompliantCount': critical_non_compliant_count,
                'SecurityNonCompliantCount': security_non_compliant_count,
                'swoMonitor': swo_monitor,
                'swoBackup': swo_backup,
                'swoPatch': swo_patch,
                'StartStop': start_stop
            })

    # Data structure per account and region
    account_data = {
        'AccountId': account_id,
        'AccountName': account_name,
        'Region': region,
        'Instances': instance_info
    }

    # Save information to S3 bucket
    bucket_name = os.environ.get("BUCKET_NAME")
    file_name = f'instance-info-{account_id}-{region}.json'
    s3.put_object(
        Bucket=bucket_name,
        Key=file_name,
        Body=json.dumps(account_data),
        ContentType='application/json'
    )

    return {
        'statusCode': 200,
        'body': json.dumps(f'EC2 instance information sent to S3 bucket {bucket_name} on management account.')
    }
