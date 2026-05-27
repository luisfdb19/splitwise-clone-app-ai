'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useOrganization, useUser } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldAlert, X, Mail } from 'lucide-react';
import { OrganizationMembershipResource, OrganizationInvitationResource } from '@clerk/types';
import { getNicknames, saveNickname } from '@/app/actions';

interface GroupMembersProps {
  isAdmin: boolean;
}

const getColorForName = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function GroupMembers({ isAdmin }: GroupMembersProps) {
  const { organization } = useOrganization();
  const { user } = useUser();
  const { toast } = useToast();

  const [members, setMembers] = useState<OrganizationMembershipResource[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitationResource[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [nicknames, setNicknames] = useState<{ [userId: string]: string }>({});
  const [editingNicknames, setEditingNicknames] = useState<{ [memberId: string]: string }>({});

  const fetchNicknames = async () => {
    try {
      const data = await getNicknames();
      setNicknames(data);
    } catch (error) {
      console.error('Error fetching nicknames:', error);
    }
  };

  const handleUpdateNickname = async (userId: string, memberId: string, email: string, name: string) => {
    const nickname = editingNicknames[memberId];
    if (!userId) return;
    
    // Generate alternative keys to match slugified/imported records
    const emailPrefix = email ? email.split('@')[0] : '';
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const alternativeKeys = [email, emailPrefix, name, slug, name.toLowerCase()].filter(Boolean);

    try {
      const res = await saveNickname(userId, nickname, alternativeKeys);
      if (res.success) {
        toast({ title: 'Sucesso', description: 'Apelido atualizado com sucesso!' });
        await fetchNicknames();
        const updatedEditing = { ...editingNicknames };
        delete updatedEditing[memberId];
        setEditingNicknames(updatedEditing);
      } else {
        throw new Error();
      }
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar o apelido.', variant: 'destructive' });
    }
  };

  const fetchMembers = async () => {
    if (!organization) return;
    try {
      const memberships = await organization.getMemberships();
      setMembers(memberships.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchInvitations = async () => {
    if (!organization || !isAdmin) return;
    try {
      const pendingInvites = await organization.getInvitations();
      const memberships = await organization.getMemberships();
      const memberEmails = new Set(
        memberships.data.map((m) => m.publicUserData.identifier?.toLowerCase())
      );
      const filteredInvites = pendingInvites.data.filter(
        (invite) => invite.emailAddress && !memberEmails.has(invite.emailAddress.toLowerCase())
      );
      setInvitations(filteredInvites);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (organization) {
      Promise.all([fetchMembers(), fetchInvitations(), fetchNicknames()]).finally(() =>
        setLoading(false)
      );
    }
  }, [organization, isAdmin]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !inviteEmail) return;

    setActionLoading('invite');
    try {
      await organization.inviteMember({
        emailAddress: inviteEmail,
        role: 'org:member',
      });
      toast({ title: 'Success', description: 'Invitation sent!' });
      setInviteEmail('');
      await fetchInvitations();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as { errors?: { message: string }[] }).errors?.[0]?.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (member: OrganizationMembershipResource) => {
    if (!organization) return;
    const newRole = member.role === 'org:admin' ? 'org:member' : 'org:admin';
    setActionLoading(`role-${member.id}`);
    try {
      await member.update({ role: newRole });
      toast({ title: 'Success', description: 'Role updated successfully' });
      await fetchMembers();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as { errors?: { message: string }[] }).errors?.[0]?.message || 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!organization) return;
    setActionLoading(`remove-${userId}`);
    try {
      await organization.removeMember(userId);
      toast({ title: 'Success', description: 'Member removed successfully' });
      await fetchMembers();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as { errors?: { message: string }[] }).errors?.[0]?.message || 'Failed to remove member',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvitation = async (invitation: OrganizationInvitationResource) => {
    setActionLoading(`revoke-${invitation.id}`);
    try {
      await invitation.revoke();
      toast({ title: 'Success', description: 'Invitation revoked' });
      await fetchInvitations();
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as { errors?: { message: string }[] }).errors?.[0]?.message || 'Failed to revoke invitation',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading members...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Invite Section */}
      {isAdmin && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Invite new members</h3>
            <form onSubmit={handleInvite} className="flex gap-3">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-grow"
              />
              <Button type="submit" disabled={actionLoading === 'invite'}>
                {actionLoading === 'invite' ? 'Inviting...' : 'Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Members ({members.length})</h3>
        <div className="space-y-4">
          {members.map((member) => {
            const isMe = user?.id === member.publicUserData.userId;
            const name =
              `${member.publicUserData.firstName || ''} ${member.publicUserData.lastName || ''}`.trim() ||
              'Unknown';
            const email = member.publicUserData.identifier;
            const isAdminRole = member.role === 'org:admin';

            return (
              <Card key={member.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 ${getColorForName(
                        name
                      )} rounded-full flex items-center justify-center text-white font-semibold`}
                    >
                      {getInitials(name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {nicknames[member.publicUserData.userId ?? ''] || name} {isMe && '(Você)'}
                        </h4>
                        {nicknames[member.publicUserData.userId ?? ''] && (
                          <span className="text-xs text-gray-400 font-normal">
                            ({name})
                          </span>
                        )}
                        <Badge variant={isAdminRole ? 'default' : 'secondary'}>
                          {isAdminRole ? 'Admin' : 'Membro'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{email}</p>
                      
                      {/* Nickname setting field */}
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Definir apelido..."
                          value={editingNicknames[member.id] !== undefined ? editingNicknames[member.id] : (nicknames[member.publicUserData.userId ?? ''] || '')}
                          onChange={(e) => {
                            setEditingNicknames({
                              ...editingNicknames,
                              [member.id]: e.target.value,
                            });
                          }}
                          className="text-xs border-b border-dashed border-gray-300 focus:border-purple-500 bg-transparent py-0.5 px-1 outline-none text-gray-600 focus:ring-0 w-32"
                        />
                        {editingNicknames[member.id] !== undefined && editingNicknames[member.id] !== (nicknames[member.publicUserData.userId ?? ''] || '') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleUpdateNickname(member.publicUserData.userId ?? '', member.id, email ?? '', name)}
                          >
                            Salvar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAdmin && !isMe && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleChange(member)}
                        disabled={actionLoading === `role-${member.id}`}
                        title={isAdminRole ? 'Demote to Member' : 'Promote to Admin'}
                      >
                        {isAdminRole ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remove Member</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to remove {name} from the group? They will no longer be able to view or add expenses.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  member.publicUserData.userId &&
                                  handleRemoveMember(member.publicUserData.userId)
                                }
                              >
                                Remove
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations */}
      {isAdmin && invitations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Pending Invitations ({invitations.length})</h3>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{invitation.emailAddress}</h4>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Invited on {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeInvitation(invitation)}
                    disabled={actionLoading === `revoke-${invitation.id}`}
                  >
                    Revoke
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
